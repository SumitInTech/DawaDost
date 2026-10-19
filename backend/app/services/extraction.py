"""Structured Extraction Service for Dawa Dost.

Extracts structured medicine listings from raw markdown/text fetched by TinyFish.
Strictly validates extracted data into ExtractedListing models.
Per Hard Design Rule 1: NEVER computes prices, unit prices, or savings.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.models.schemas import ExtractedListing
from app.services.llm import llm_service

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are an expert pharmaceutical data extraction assistant.
Extract structured product listing fields from the raw webpage text of an Indian pharmacy.

Return a JSON object with EXACTLY these fields:
- product_name: (string) full product name (e.g. "Crocin 650mg Tablet")
- brand: (string or null) brand name (e.g. "Crocin", "Dolo", "Pan")
- salts: (array of strings) active chemical salt composition in lowercase (e.g. ["paracetamol"], ["amoxicillin", "clavulanic acid"])
- strength: (string) dosage strength (e.g. "650 mg", "500 mg + 125 mg", "40 mg")
- form: (string) dosage form: "tablet", "capsule", "syrup", "suspension", "injection", "gel"
- pack_size_units: (number or null) quantity in pack (e.g. 10, 15 for tablets/capsules; 100 for 100 ml syrup). Null if ambiguous.
- price_inr: (number) total selling pack price in INR (e.g. 32.28, 16.30). DO NOT invent or calculate unit prices.
- in_stock: (boolean or null) true if in stock, false if out of stock, null if unknown.

CRITICAL RULES:
1. DO NOT compute unit price or savings. Only extract the total pack price.
2. If pack size is unclear or missing, set pack_size_units to null.
3. Keep salt names generic and lowercase (e.g. "paracetamol" not "Paracetamol IP").
4. Output valid JSON only without markdown code fences.
"""


class ExtractionService:
    """Extracts and strictly validates medicine listings."""

    async def extract_listing(
        self,
        raw_text: str,
        source: str,
        url: str,
    ) -> ExtractedListing | None:
        """Extract structured listing from raw webpage content."""
        if not raw_text or len(raw_text.strip()) < 20:
            logger.warning(f"Raw text too short for extraction from {url}")
            return None

        # 1. Attempt LLM extraction first if configured
        extracted_data = await self._extract_with_llm(raw_text)

        # 2. If LLM is not configured or failed, use deterministic regex extraction
        if not extracted_data:
            extracted_data = self._extract_with_heuristics(raw_text, source, url)

        if not extracted_data:
            return None

        # Ensure source and url are attached
        extracted_data["source"] = source
        extracted_data["url"] = url

        # 3. Strictly validate via Pydantic ExtractedListing
        try:
            listing = ExtractedListing(**extracted_data)
            return listing
        except Exception as exc:
            logger.warning(f"Pydantic validation failed for extraction from {url}: {exc}")
            return None

    async def _extract_with_llm(self, raw_text: str) -> dict[str, Any] | None:
        """Call LLM provider to extract structured fields."""
        # Truncate text to avoid exceeding token limits while preserving critical header/pricing info
        snippet = raw_text[:4000]
        prompt = f"Webpage text:\n\n{snippet}\n\nExtract the medicine listing details in JSON:"

        try:
            res = await llm_service.complete_json(
                prompt=prompt,
                system_prompt=EXTRACTION_SYSTEM_PROMPT,
            )
            if isinstance(res, dict) and "price_inr" in res:
                return res
        except Exception as exc:
            logger.debug(f"LLM extraction skipped or failed: {exc}")

        return None

    def _extract_with_heuristics(
        self,
        raw_text: str,
        source: str,
        url: str,
    ) -> dict[str, Any] | None:
        """Deterministic regex heuristic fallback parser for pharmacy product pages."""
        # 1. Extract Price (e.g., ₹32.28 or Rs. 32.28 or MRP ₹32.28)
        price_match = re.search(r"(?:₹|Rs\.?)\s*([0-9]+(?:\.[0-9]{1,2})?)", raw_text)
        if not price_match:
            return None

        try:
            price_inr = float(price_match.group(1))
        except ValueError:
            return None

        # 2. Extract Pack Size (e.g., "15 tablets", "strip of 10 tablets", "100 ml")
        pack_size_units = None
        pack_match = re.search(
            r"(?:strip of\s*)?([0-9]+)\s*(?:tablets?|capsules?|tabs?|caps?|ml|vial|bottle)",
            raw_text,
            re.IGNORECASE,
        )
        if pack_match:
            try:
                pack_size_units = float(pack_match.group(1))
            except ValueError:
                pack_size_units = None

        # 3. Extract Form
        form = "tablet"
        lower_text = raw_text.lower()
        if "capsule" in lower_text or "cap" in lower_text:
            form = "capsule"
        elif "syrup" in lower_text or "suspension" in lower_text:
            form = "syrup"
        elif "injection" in lower_text:
            form = "injection"

        # 4. Extract Title / Product Name
        title_match = re.search(r"^#\s*([^\n\r]+)", raw_text, re.MULTILINE)
        product_name = title_match.group(1).strip() if title_match else ""
        if not product_name:
            first_line = [l.strip() for l in raw_text.splitlines() if l.strip()]
            product_name = first_line[0] if first_line else "Medicine Product"

        # 5. Extract Salt Composition
        salts = []
        salt_match = re.search(
            r"(?:Composition|Contains|Salt Composition)[\s:]*([^\n\r]+)",
            raw_text,
            re.IGNORECASE,
        )
        if salt_match:
            salt_str = salt_match.group(1).lower()
            # Clean out dosage numbers (e.g., "paracetamol (650mg)" -> "paracetamol")
            salt_str = re.sub(r"\([^)]*\)", "", salt_str)
            salt_str = re.sub(r"[0-9]+\s*(?:mg|g|mcg|iu)", "", salt_str)
            for s in re.split(r"[,+&/]", salt_str):
                clean_s = s.strip()
                if clean_s and len(clean_s) > 2:
                    salts.append(clean_s)

        # 6. Extract Strength
        strength_match = re.search(
            r"([0-9]+(?:\.[0-9]+)?\s*(?:mg|g|mcg|iu)(?:\s*\+\s*[0-9]+(?:\.[0-9]+)?\s*(?:mg|g|mcg|iu))?)",
            product_name + " " + raw_text[:500],
            re.IGNORECASE,
        )
        strength = strength_match.group(1).strip().lower() if strength_match else "standard"

        # 7. Extract Brand
        brand = product_name.split()[0] if product_name else None

        flags = []
        if pack_size_units is None:
            flags.append("pack_size_unclear")

        return {
            "product_name": product_name,
            "brand": brand,
            "salts": salts,
            "strength": strength,
            "form": form,
            "pack_size_units": pack_size_units,
            "price_inr": price_inr,
            "in_stock": True,
            "flags": flags,
        }


extraction_service = ExtractionService()
