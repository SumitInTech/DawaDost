"""TinyFish API Client: Search, Fetch and Agent wrappers.

All TinyFish integration is centralized in this module according to architecture rules.
Schemas and endpoints correspond directly to TinyFish OpenAPI specifications.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Directory where samples of raw responses are stored
SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "samples"


class TinyFishError(Exception):
    """Base exception for TinyFish API errors."""

    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class TinyFishClient:
    """Client for TinyFish Search, Fetch, and Agent APIs."""

    SEARCH_BASE_URL = "https://api.search.tinyfish.ai"
    FETCH_BASE_URL = "https://api.fetch.tinyfish.ai"
    AGENT_BASE_URL = "https://agent.tinyfish.ai"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.TINYFISH_API_KEY
        if not self.api_key:
            logger.warning(
                "TINYFISH_API_KEY is not set. Real TinyFish calls will fail until configured."
            )

    def _get_headers(self) -> dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "DawaDost/1.0",
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    def save_sample(self, filename: str, data: Any) -> Path:
        """Helper to save raw API responses to the samples/ directory for verification."""
        SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
        target_path = SAMPLES_DIR / filename
        with open(target_path, "w", encoding="utf-8") as f:
            if isinstance(data, (dict, list)):
                json.dump(data, f, indent=2, ensure_ascii=False)
            else:
                f.write(str(data))
        logger.info(f"Saved raw response sample to {target_path}")
        return target_path

    async def search(
        self,
        query: str,
        purpose: str | None = None,
        location: str = "IN",
        language: str = "en",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
        domain_type: Literal["web", "news", "research_paper"] = "web",
        page: int = 0,
        timeout: float = 15.0,
    ) -> dict[str, Any]:
        """Search the web using TinyFish Search API.

        GET https://api.search.tinyfish.ai
        """
        params: dict[str, Any] = {
            "query": query,
            "location": location,
            "language": language,
            "domain_type": domain_type,
            "page": page,
        }
        if purpose:
            params["purpose"] = purpose
        if include_domains:
            params["include_domains"] = ",".join(include_domains)
        if exclude_domains:
            params["exclude_domains"] = ",".join(exclude_domains)

        headers = {"X-API-Key": self.api_key} if self.api_key else {}

        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.get(
                    self.SEARCH_BASE_URL,
                    headers=headers,
                    params=params,
                )
                if response.status_code >= 400:
                    try:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", response.text)
                    except Exception:
                        err_msg = response.text
                    raise TinyFishError(
                        f"TinyFish Search failed ({response.status_code}): {err_msg}",
                        status_code=response.status_code,
                    )
                return response.json()
            except httpx.RequestError as exc:
                raise TinyFishError(f"HTTP request error during TinyFish search: {exc}")

    async def fetch(
        self,
        urls: list[str],
        format: Literal["markdown", "html", "json"] = "markdown",
        ttl: int | None = 0,
        purpose: str | None = None,
        per_url_timeout_ms: int = 45000,
        include_selectors: list[str] | None = None,
        exclude_selectors: list[str] | None = None,
        timeout: float = 120.0,
    ) -> dict[str, Any]:
        """Fetch and extract clean page content using TinyFish Fetch API.

        POST https://api.fetch.tinyfish.ai
        """
        if not urls:
            return {"results": [], "errors": []}

        # Fetch API accepts 1-10 URLs per batch
        payload: dict[str, Any] = {
            "urls": urls[:10],
            "format": format,
            "per_url_timeout_ms": per_url_timeout_ms,
        }
        if ttl is not None:
            payload["ttl"] = ttl
        if purpose:
            payload["purpose"] = purpose
        if include_selectors:
            payload["include_selectors"] = include_selectors
        if exclude_selectors:
            payload["exclude_selectors"] = exclude_selectors

        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.post(
                    self.FETCH_BASE_URL,
                    headers=self._get_headers(),
                    json=payload,
                )
                if response.status_code >= 400:
                    try:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", response.text)
                    except Exception:
                        err_msg = response.text
                    raise TinyFishError(
                        f"TinyFish Fetch failed ({response.status_code}): {err_msg}",
                        status_code=response.status_code,
                    )
                return response.json()
            except httpx.RequestError as exc:
                raise TinyFishError(f"HTTP request error during TinyFish fetch: {exc}")

    async def run_agent(
        self,
        url: str,
        goal: str,
        browser_profile: Literal["lite", "stealth"] = "lite",
        proxy_config: dict[str, Any] | None = None,
        output_schema: dict[str, Any] | None = None,
        agent_config: dict[str, Any] | None = None,
        timeout: float = 150.0,
    ) -> dict[str, Any]:
        """Run browser automation task synchronously using TinyFish Agent API.

        POST https://agent.tinyfish.ai/v1/automation/run
        """
        payload: dict[str, Any] = {
            "url": url,
            "goal": goal,
            "browser_profile": browser_profile,
        }
        if proxy_config:
            payload["proxy_config"] = proxy_config
        if output_schema:
            payload["output_schema"] = output_schema
        if agent_config:
            payload["agent_config"] = agent_config

        endpoint = f"{self.AGENT_BASE_URL}/v1/automation/run"

        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.post(
                    endpoint,
                    headers=self._get_headers(),
                    json=payload,
                )
                if response.status_code >= 400:
                    try:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", response.text)
                    except Exception:
                        err_msg = response.text
                    raise TinyFishError(
                        f"TinyFish Agent failed ({response.status_code}): {err_msg}",
                        status_code=response.status_code,
                    )
                return response.json()
            except httpx.RequestError as exc:
                raise TinyFishError(f"HTTP request error during TinyFish agent run: {exc}")


# Default singleton instance
tinyfish_client = TinyFishClient()
