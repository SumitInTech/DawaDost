"""LLM Provider Abstraction.

Wraps LLM completion calls behind a clean provider interface.
Used ONLY for extracting structured fields from raw web text and
fallback salt resolution.
NEVER computes prices, savings, or equivalence match decisions.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Provider abstraction supporting Gemini and OpenAI with graceful fallback."""

    def __init__(self, provider: str | None = None, api_key: str | None = None):
        self.provider = provider or settings.LLM_PROVIDER.lower()
        self.api_key = api_key or settings.LLM_API_KEY
        self._client = None
        self._init_client()

    def _init_client(self) -> None:
        if not self.api_key:
            logger.info("LLM_API_KEY is not set. Deterministic heuristic extraction will be used as fallback.")
            return

        try:
            if self.provider == "gemini":
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            elif self.provider == "openai":
                import openai
                self._client = openai.AsyncOpenAI(api_key=self.api_key)
        except Exception as exc:
            logger.warning(f"Failed to initialize LLM provider '{self.provider}': {exc}")

    async def complete_json(self, prompt: str, system_prompt: str | None = None) -> dict[str, Any] | list[Any] | None:
        """Execute LLM prompt and return structured JSON."""
        if not self.api_key or not self._client:
            return None

        try:
            if self.provider == "gemini":
                # Using google-genai SDK
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                response = self._client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=full_prompt,
                    config={"response_mime_type": "application/json"},
                )
                text = response.text
                if text:
                    return json.loads(text)
            elif self.provider == "openai":
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                res = await self._client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    response_format={"type": "json_object"},
                )
                content = res.choices[0].message.content
                if content:
                    return json.loads(content)
        except Exception as exc:
            logger.error(f"LLM completion error: {exc}")
            return None

        return None


llm_service = LLMService()
