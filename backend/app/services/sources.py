"""Parallel Pharmacy Source Orchestrator.

Loads configuration from backend/sources.yaml, executes live searches and fetches
across configured pharmacy websites concurrently using asyncio, isolates failures,
and returns per-source execution statuses. Supports both TinyFish Fetch and TinyFish Agent.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from app.config import settings
from app.models.schemas import ResolvedMedicine, SourceStatus
from app.services.tinyfish_client import TinyFishClient, TinyFishError, tinyfish_client

logger = logging.getLogger(__name__)

SOURCES_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "sources.yaml"


class SourceOrchestrator:
    """Orchestrates concurrent fetching across configured pharmacy websites."""

    def __init__(
        self,
        config_path: Path | str | None = None,
        client: TinyFishClient | None = None,
    ):
        self.config_path = Path(config_path or SOURCES_CONFIG_PATH)
        self.client = client or tinyfish_client
        self.sources = self._load_sources()

    def _load_sources(self) -> list[dict[str, Any]]:
        """Load sources list from sources.yaml."""
        if not self.config_path.exists():
            logger.warning(f"sources.yaml not found at {self.config_path}, using defaults.")
            return []
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                return data.get("sources", [])
        except Exception as exc:
            logger.error(f"Error loading sources config: {exc}")
            return []

    def get_enabled_sources(self) -> list[dict[str, Any]]:
        return [s for s in self.sources if s.get("enabled", True)]

    async def _fetch_with_agent(
        self,
        source: dict[str, Any],
        url: str,
        resolved: ResolvedMedicine,
        query: str,
        pincode: str | None,
        now: datetime,
        browser_profile: str = "lite",
    ) -> tuple[SourceStatus, list[dict[str, Any]]]:
        """Execute TinyFish Agent browser automation for interactive sites or anti-bot bypass."""
        name = source.get("name", "Unknown Pharmacy")
        pincode_instruction = (
            f" If there is a delivery pincode or location prompt, enter '{pincode}' to check availability."
            if pincode
            else ""
        )
        goal = (
            f"Find medicine listing details for '{query}' on this page.{pincode_instruction} "
            f"Extract the exact product name, brand, active salts, strength, dosage form (e.g. tablet, capsule, syrup), "
            f"pack size units (count of tablets or ml), total pack price in INR, and in_stock status."
        )
        output_schema = {
            "type": "object",
            "properties": {
                "product_name": {"type": "string"},
                "brand": {"type": "string", "nullable": True},
                "salts": {"type": "array", "items": {"type": "string"}},
                "strength": {"type": "string", "nullable": True},
                "form": {"type": "string", "nullable": True},
                "pack_size_units": {"type": "number", "nullable": True},
                "price_inr": {"type": "number"},
                "in_stock": {"type": "boolean", "nullable": True},
                "delivery_info": {"type": "string", "nullable": True},
            },
            "required": ["product_name", "price_inr"],
        }

        try:
            agent_res = await self.client.run_agent(
                url=url,
                goal=goal,
                browser_profile=browser_profile,  # type: ignore[arg-type]
                output_schema=output_schema,
                timeout=25.0,
            )
            result = agent_res.get("result") or {}
            steps = agent_res.get("num_of_steps", 1)

            if result and result.get("product_name") and result.get("price_inr"):
                # Save structured raw sample for auditability & demo proof
                self.client.save_sample(
                    f"agent_{name.lower().replace(' ', '_')}_{now.strftime('%Y%m%d_%H%M%S')}.json",
                    agent_res,
                )

                # Format into structured markdown text for unified downstream parsing
                salts_str = ", ".join(result.get("salts", [])) if isinstance(result.get("salts"), list) else str(result.get("salts", ""))
                structured_md = (
                    f"# {result.get('product_name')}\n"
                    f"Brand: {result.get('brand') or ''}\n"
                    f"Salts: {salts_str}\n"
                    f"Strength: {result.get('strength') or ''}\n"
                    f"Form: {result.get('form') or ''}\n"
                    f"Pack Size: {result.get('pack_size_units') or ''}\n"
                    f"Price: Rs. {result.get('price_inr')}\n"
                    f"In Stock: {result.get('in_stock', True)}\n"
                )
                deliv_info = result.get("delivery_info") or (f"Deliverable to {pincode}" if pincode else "In Stock")
                raw_page = {
                    "source": name,
                    "url": url,
                    "title": result.get("product_name", ""),
                    "markdown_text": structured_md,
                    "fetched_at": now.isoformat(),
                    "delivery_pincode": pincode,
                    "delivery_info": deliv_info,
                    "agent_steps": steps,
                }
                return (
                    SourceStatus(
                        name=name,
                        status="ok",
                        fetched_at=now,
                        message=f"Live extracted via TinyFish Agent ({steps} steps)",
                    ),
                    [raw_page],
                )
            else:
                err_msg = "Agent returned incomplete product data"
                if isinstance(agent_res.get("error"), dict):
                    err_msg = agent_res["error"].get("message", err_msg)
                return (
                    SourceStatus(
                        name=name,
                        status="failed",
                        fetched_at=now,
                        message=err_msg,
                    ),
                    [],
                )
        except Exception as exc:
            logger.warning(f"TinyFish Agent execution error for {name}: {exc}")
            return (
                SourceStatus(
                    name=name,
                    status="failed",
                    fetched_at=now,
                    message=f"Agent error: {exc}",
                ),
                [],
            )

    async def fetch_from_source(
        self,
        source: dict[str, Any],
        resolved: ResolvedMedicine,
        query: str,
        pincode: str | None = None,
    ) -> tuple[SourceStatus, list[dict[str, Any]]]:
        """Fetch medicine listings from a single pharmacy source.

        Isolates failures and returns (SourceStatus, list_of_raw_pages).
        """
        name = source.get("name", "Unknown Pharmacy")
        domain = source.get("domain", "")
        strategy = source.get("strategy", "fetch")
        now = datetime.now(timezone.utc)

        # Build search query for this source (e.g., brand or active salts + strength)
        search_terms = []
        if resolved.brand:
            search_terms.append(resolved.brand)
        if resolved.salts:
            search_terms.append(" ".join(resolved.salts))
        if resolved.strength and resolved.strength != "standard":
            search_terms.append(resolved.strength)
        
        # Primary search phrase
        search_phrase = " ".join(search_terms) if search_terms else query

        try:
            # 1. Search for product listings on this pharmacy's domain using TinyFish Search
            domain_query = f"site:{domain} {search_phrase}"
            search_res = await self.client.search(
                query=domain_query,
                location="IN",
                language="en",
            )
            results = search_res.get("results", [])

            if not results:
                # Try generic query if site-specific search was too narrow
                fallback_query = f"site:{domain} {query}"
                search_res = await self.client.search(
                    query=fallback_query,
                    location="IN",
                    language="en",
                )
                results = search_res.get("results", [])

            if not results:
                return (
                    SourceStatus(
                        name=name,
                        status="ok",
                        fetched_at=now,
                        message="Search returned no matching product listings",
                    ),
                    [],
                )

            # Get top 2 product URLs from this pharmacy
            target_urls = [r["url"] for r in results[:2] if "url" in r]
            if not target_urls:
                return (
                    SourceStatus(
                        name=name,
                        status="ok",
                        fetched_at=now,
                        message="No valid URLs found in search results",
                    ),
                    [],
                )

            # 2. Fetch via Agent or Fetch strategy
            if strategy == "agent":
                logger.info(f"Using TinyFish Agent for {name} ({target_urls[0]})...")
                return await self._fetch_with_agent(
                    source=source,
                    url=target_urls[0],
                    resolved=resolved,
                    query=query,
                    pincode=pincode,
                    now=now,
                    browser_profile="stealth" if source.get("stealth_needed") else "lite",
                )

            # Standard TinyFish Fetch
            fetch_res = await self.client.fetch(
                urls=target_urls,
                format="markdown",
                ttl=0,
                per_url_timeout_ms=30000,
            )

            raw_pages = []
            for item in fetch_res.get("results", []):
                raw_text = item.get("text", "")
                
                # Check for delivery timeline indications for the user's pincode
                delivery_info = f"Deliverable to {pincode}" if pincode else "In Stock"
                if "tomorrow" in raw_text.lower():
                    delivery_info = f"Fast delivery by tomorrow to {pincode}" if pincode else "Fast delivery by tomorrow"
                elif "24-48" in raw_text or "2-3 days" in raw_text.lower():
                    delivery_info = f"Estimated delivery 2-3 days to {pincode}" if pincode else "Estimated delivery 2-3 days"

                raw_pages.append(
                    {
                        "source": name,
                        "url": item.get("url"),
                        "title": item.get("title", ""),
                        "markdown_text": raw_text,
                        "fetched_at": now.isoformat(),
                        "delivery_pincode": pincode,
                        "delivery_info": delivery_info,
                    }
                )

            # Check if any errors occurred
            errors = fetch_res.get("errors", [])
            status_type = "ok"
            err_msg = None

            if not raw_pages and errors:
                first_err = errors[0].get("error", "unknown")
                if "block" in first_err or "bot" in first_err:
                    logger.info(f"Source {name} blocked by bot protection. Falling back to TinyFish Agent (stealth)...")
                    return await self._fetch_with_agent(
                        source=source,
                        url=target_urls[0],
                        resolved=resolved,
                        query=query,
                        pincode=pincode,
                        now=now,
                        browser_profile="stealth",
                    )
                else:
                    status_type = "failed"
                    err_msg = f"Fetch error: {first_err}"

            return (
                SourceStatus(
                    name=name,
                    status=status_type,  # type: ignore[arg-type]
                    fetched_at=now,
                    message=err_msg,
                ),
                raw_pages,
            )

        except TinyFishError as tfe:
            status = "blocked" if tfe.status_code in (403, 429) else "failed"
            logger.warning(f"TinyFish error fetching from {name}: {tfe}")
            return (
                SourceStatus(
                    name=name,
                    status=status,  # type: ignore[arg-type]
                    fetched_at=now,
                    message=str(tfe.message),
                ),
                [],
            )
        except Exception as exc:
            logger.exception(f"Unexpected error fetching from {name}: {exc}")
            return (
                SourceStatus(
                    name=name,
                    status="failed",
                    fetched_at=now,
                    message=str(exc),
                ),
                [],
            )

    async def fetch_all_sources(
        self,
        resolved: ResolvedMedicine,
        query: str,
        pincode: str | None = None,
    ) -> tuple[list[SourceStatus], list[dict[str, Any]]]:
        """Runs all enabled sources concurrently with asyncio.gather.

        Guarantees that a failure in one source does NOT fail other sources.
        """
        enabled = self.get_enabled_sources()
        if not enabled:
            logger.warning("No enabled sources in sources.yaml!")
            return [], []

        tasks = [
            self.fetch_from_source(source, resolved, query, pincode)
            for source in enabled
        ]

        # Concurrently gather all source runs
        results = await asyncio.gather(*tasks, return_exceptions=True)

        statuses: list[SourceStatus] = []
        all_raw_pages: list[dict[str, Any]] = []

        now = datetime.now(timezone.utc)

        for i, res in enumerate(results):
            source_cfg = enabled[i]
            source_name = source_cfg.get("name", f"Source {i}")

            if isinstance(res, Exception):
                logger.error(f"Source {source_name} raised uncaught exception: {res}")
                statuses.append(
                    SourceStatus(
                        name=source_name,
                        status="failed",
                        fetched_at=now,
                        message=str(res),
                    )
                )
            else:
                source_status, pages = res
                statuses.append(source_status)
                all_raw_pages.extend(pages)

        return statuses, all_raw_pages


# Singleton source orchestrator
source_orchestrator = SourceOrchestrator()
