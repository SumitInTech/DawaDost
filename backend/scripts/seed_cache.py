"""Seed SQLite cache with verified real live verification runs from samples/.

Ensures offline demonstration and hackathon resilience as required by AGENTS.md.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.cache import cache_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_cache")

SAMPLES_PATH = backend_dir.parent / "samples" / "e2e_live_verification.json"


def seed_cache():
    if not SAMPLES_PATH.exists():
        logger.warning(f"Samples file not found at {SAMPLES_PATH}")
        return

    with open(SAMPLES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        logger.warning("Invalid samples file format")
        return

    for item in data:
        query = item.get("query")
        if not query:
            continue

        # Common test pincodes
        for pincode in ["110001", "110006"]:
            payload = dict(item)
            payload["pincode"] = pincode
            # Ensure long TTL for demo resilience
            cache_service.set_search(query, payload, pincode=pincode, ttl_minutes=525600)
            logger.info(f"Seeded cache for '{query}' (pincode: {pincode})")


if __name__ == "__main__":
    seed_cache()
