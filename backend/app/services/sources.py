"""Parallel Pharmacy Source Orchestrator.

Loads configuration from backend/sources.yaml, executes live searches and fetches
across configured pharmacy websites concurrently using asyncio, isolates failures,
and returns per-source execution statuses.
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
            # 1. Search for product listings on this pharmacy's domain
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

            # 2. Fetch page contents using TinyFish Fetch
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
                delivery_info = f"Deliverable to {pincode}"
                if "tomorrow" in raw_text.lower():
                    delivery_info = f"Fast delivery by tomorrow to {pincode}"
                elif "24-48" in raw_text or "2-3 days" in raw_text.lower():
                    delivery_info = f"Estimated delivery 2-3 days to {pincode}"

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
                    status_type = "blocked"
                    err_msg = f"Bot protection challenge detected: {first_err}"
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
