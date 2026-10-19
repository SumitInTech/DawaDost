"""SQLite Cache Service for Dawa Dost.

Provides timestamped caching with TTL for search queries and fetched web pages.
Supports USE_CACHE_ONLY mode as a resilient offline/demo fallback.
"""

from __future__ import annotations

import contextlib
import json
import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Generator

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Thread-safe SQLite caching service."""

    def __init__(self, db_path: str | Path | None = None, ttl_minutes: int | None = None):
        p = Path(db_path or settings.CACHE_DB_PATH)
        if not p.is_absolute():
            backend_dir = Path(__file__).resolve().parent.parent.parent
            p = backend_dir / p.name
        self.db_path = p
        self.ttl_minutes = ttl_minutes if ttl_minutes is not None else settings.CACHE_TTL_MINUTES
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextlib.contextmanager
    def _connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Initialize SQLite tables for search results and fetched page contents."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS search_cache (
                    query_key TEXT PRIMARY KEY,
                    query TEXT NOT NULL,
                    pincode TEXT,
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS url_cache (
                    url TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    @staticmethod
    def _make_search_key(query: str, pincode: str | None) -> str:
        q = query.strip().lower()
        pin = (pincode or "").strip()
        return f"{q}::{pin}"

    def get_search(
        self,
        query: str,
        pincode: str | None = None,
        force_cache_only: bool | None = None,
    ) -> dict[str, Any] | None:
        """Retrieve cached search response.

        If USE_CACHE_ONLY is active (or force_cache_only=True), serves the latest
        cached entry even if expired.
        """
        use_cache_only = (
            force_cache_only if force_cache_only is not None else settings.USE_CACHE_ONLY
        )
        key = self._make_search_key(query, pincode)
        now = datetime.now(timezone.utc)

        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT data_json, created_at, expires_at FROM search_cache WHERE query_key = ?",
                (key,),
            )
            row = cursor.fetchone()
            if not row:
                return None

            expires_at = datetime.fromisoformat(row["expires_at"])
            if use_cache_only or now <= expires_at:
                try:
                    data = json.loads(row["data_json"])
                    if isinstance(data, dict):
                        data["_cached"] = True
                        data["_cached_at"] = row["created_at"]
                    return data
                except json.JSONDecodeError:
                    return None

            return None

    def set_search(
        self,
        query: str,
        data: dict[str, Any],
        pincode: str | None = None,
        ttl_minutes: int | None = None,
    ) -> None:
        """Save a search response in cache with timestamps."""
        key = self._make_search_key(query, pincode)
        ttl = ttl_minutes if ttl_minutes is not None else self.ttl_minutes
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=ttl)

        data_to_store = {k: v for k, v in data.items() if not k.startswith("_cached")}

        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO search_cache (query_key, query, pincode, data_json, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    key,
                    query,
                    pincode,
                    json.dumps(data_to_store, ensure_ascii=False),
                    now.isoformat(),
                    expires.isoformat(),
                ),
            )
            conn.commit()

    def get_url(self, url: str) -> dict[str, Any] | None:
        """Retrieve cached URL content."""
        use_cache_only = settings.USE_CACHE_ONLY
        now = datetime.now(timezone.utc)

        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT data_json, created_at, expires_at FROM url_cache WHERE url = ?",
                (url,),
            )
            row = cursor.fetchone()
            if not row:
                return None

            expires_at = datetime.fromisoformat(row["expires_at"])
            if use_cache_only or now <= expires_at:
                try:
                    return json.loads(row["data_json"])
                except json.JSONDecodeError:
                    return None
            return None

    def set_url(
        self,
        url: str,
        data: dict[str, Any],
        ttl_minutes: int | None = None,
    ) -> None:
        """Save fetched URL content in cache."""
        ttl = ttl_minutes if ttl_minutes is not None else self.ttl_minutes
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=ttl)

        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO url_cache (url, data_json, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (url, json.dumps(data, ensure_ascii=False), now.isoformat(), expires.isoformat()),
            )
            conn.commit()

    def clear_expired(self) -> int:
        """Clear expired cache entries."""
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM search_cache WHERE expires_at < ?", (now,))
            deleted_search = cursor.rowcount
            cursor.execute("DELETE FROM url_cache WHERE expires_at < ?", (now,))
            deleted_urls = cursor.rowcount
            conn.commit()
            return deleted_search + deleted_urls


cache_service = CacheService()
