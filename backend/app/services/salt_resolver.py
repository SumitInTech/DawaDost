"""Salt Resolver Service for Dawa Dost.

Resolves a branded medicine or search query to its active salt(s), strength and form.
Per Section 10:
1. Look up the brand in a local table seeded by the 20 verified test medicines.
2. If missing, use the LLM and mark resolved_by: llm.
3. If still unresolved, return None with a clear warning. Never guess.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from rapidfuzz import fuzz, process

from app.models.schemas import ResolvedMedicine
from app.services.llm import llm_service

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "tests" / "data" / "medicines.json"


class SaltResolver:
    """Resolves branded medicine names to salt composition, strength and dosage form."""

    def __init__(self, seed_data_path: Path | str | None = None):
        self.data_path = Path(seed_data_path or DATA_PATH)
        self.local_table: list[dict[str, Any]] = self._load_seed_data()

    def _load_seed_data(self) -> list[dict[str, Any]]:
        if not self.data_path.exists():
            logger.warning(f"Seed medicines file not found at {self.data_path}")
            return []
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error(f"Error loading verified seed medicines: {exc}")
            return []

    async def resolve(self, query: str) -> ResolvedMedicine | None:
        """Resolve query using local verified table first, then LLM fallback."""
        clean_q = query.strip().lower()
        if not clean_q:
            return None

        # 1. Exact or fuzzy match against local table
        local_match = self._lookup_local_table(clean_q)
        if local_match:
            return local_match

        # 2. Check if the query itself is a salt (e.g. "paracetamol 650mg")
        salt_match = self._check_direct_salt(clean_q)
        if salt_match:
            return salt_match

        # 3. LLM Fallback (marked as resolved_by="llm")
        llm_match = await self._resolve_with_llm(query)
        if llm_match:
            return llm_match

        logger.warning(f"Could not resolve medicine for query: '{query}'")
        return None

    def _lookup_local_table(self, query: str) -> ResolvedMedicine | None:
        """Look up medicine in verified local seed table."""
        # Exact match
        for entry in self.local_table:
            brand = entry["brand"].lower()
            if brand == query or query in brand or brand in query:
                return ResolvedMedicine(
                    brand=entry["brand"],
                    salts=[s.lower() for s in entry["salts"]],
                    strength=entry["strength"],
                    form=entry["form"],
                    resolved_by="local_table",
                )
            for eq in entry.get("known_equivalents", []):
                if eq.lower() == query or query in eq.lower():
                    return ResolvedMedicine(
                        brand=entry["brand"],
                        salts=[s.lower() for s in entry["salts"]],
                        strength=entry["strength"],
                        form=entry["form"],
                        resolved_by="local_table",
                    )

        # Fuzzy match (threshold >= 85)
        brand_names = [e["brand"] for e in self.local_table]
        best_match = process.extractOne(query, brand_names, scorer=fuzz.token_sort_ratio)
        if best_match and best_match[1] >= 85:
            matched_name = best_match[0]
            for entry in self.local_table:
                if entry["brand"] == matched_name:
                    return ResolvedMedicine(
                        brand=entry["brand"],
                        salts=[s.lower() for s in entry["salts"]],
                        strength=entry["strength"],
                        form=entry["form"],
                        resolved_by="local_table",
                    )

        return None

    def _check_direct_salt(self, query: str) -> ResolvedMedicine | None:
        """Check if user searched directly for known chemical salt."""
        for entry in self.local_table:
            for salt in entry["salts"]:
                if salt.lower() in query:
                    return ResolvedMedicine(
                        brand=None,
                        salts=[s.lower() for s in entry["salts"]],
                        strength=entry["strength"],
                        form=entry["form"],
                        resolved_by="local_table",
                    )
        return None

    async def _resolve_with_llm(self, query: str) -> ResolvedMedicine | None:
        """Use LLM to infer salt composition for unknown brands."""
        prompt = (
            f"Given the Indian medicine name '{query}', return the exact JSON with fields: "
            f"brand (string), salts (array of lowercase chemical salt strings), strength (string e.g. '500 mg'), form (string e.g. 'tablet'). "
            f"If you are not 100% sure of the exact chemical composition, return null."
        )
        try:
            res = await llm_service.complete_json(prompt=prompt)
            if isinstance(res, dict) and res.get("salts"):
                return ResolvedMedicine(
                    brand=res.get("brand") or query,
                    salts=[str(s).lower().strip() for s in res.get("salts", []) if str(s).strip()],
                    strength=str(res.get("strength", "standard")).strip().lower(),
                    form=str(res.get("form", "tablet")).strip().lower(),
                    resolved_by="llm",
                )
        except Exception as exc:
            logger.debug(f"LLM salt resolution failed for '{query}': {exc}")

        return None


salt_resolver = SaltResolver()
