import tempfile
from pathlib import Path
from datetime import datetime, timezone
import pytest

from app.services.cache import CacheService


def test_cache_set_and_get():
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = Path(tmp_dir) / "test_cache.db"
        cache = CacheService(db_path=db_path, ttl_minutes=60)

        query = "Crocin 650"
        sample_data = {"query": "Crocin 650", "results": [{"price": 30.0}]}

        # Before setting, should be None
        assert cache.get_search(query) is None

        # After setting
        cache.set_search(query, sample_data)
        retrieved = cache.get_search(query)
        assert retrieved is not None
        assert retrieved["query"] == "Crocin 650"
        assert retrieved["results"][0]["price"] == 30.0
        assert retrieved.get("_cached") is True


def test_cache_expiration_and_cache_only_fallback():
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = Path(tmp_dir) / "test_cache.db"
        # Set negative TTL so it expires immediately
        cache = CacheService(db_path=db_path, ttl_minutes=-10)

        query = "Dolo 650"
        sample_data = {"query": "Dolo 650", "results": [{"price": 31.0}]}
        cache.set_search(query, sample_data)

        # In normal mode, should be expired (returns None)
        assert cache.get_search(query, force_cache_only=False) is None

        # In force_cache_only mode (demo fallback), should return the cached entry
        retrieved = cache.get_search(query, force_cache_only=True)
        assert retrieved is not None
        assert retrieved["query"] == "Dolo 650"
        assert retrieved.get("_cached") is True
