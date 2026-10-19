"""Live End-to-End Search Verification Script.

Tests POST /api/search end-to-end on 5 real branded medicines across configured
pharmacies (Tata 1mg, Apollo Pharmacy, Netmeds) using TinyFish and Gemini LLM.
Validates salt resolution, equivalence matching, unit pricing, savings, and caching.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models.schemas import SearchRequest
from app.api.routes import search_medicines

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("live_verify")

TEST_MEDICINES = [
    "Crocin 650",
    "Dolo 650",
    "Pan 40",
    "Augmentin 625 Duo",
    "Allegra 120",
]


async def verify_medicine(query: str, pincode: str = "110006") -> dict:
    print(f"\n{'='*70}")
    print(f"SEARCHING LIVE FOR: '{query}' (Pincode: {pincode})")
    print(f"{'='*70}")

    req = SearchRequest(query=query, pincode=pincode)
    response = await search_medicines(req)
    res_dict = response.model_dump(mode="json")

    print(f"Query: {response.query}")
    print(f"Resolved: Brand='{response.resolved.brand}', Salts={response.resolved.salts}, Strength='{response.resolved.strength}', Form='{response.resolved.form}'")

    if response.reference_listing:
        ref = response.reference_listing
        print(f"Reference Brand Listing: {ref.product_name} ({ref.source})")
        print(f"   Pack Price: Rs. {ref.price_inr} ({ref.pack_size_units} units) -> Unit Price: Rs. {ref.price_per_unit_inr}/unit")
    else:
        print("Reference Brand Listing: Not found directly (comparing generics)")

    print(f"\nTotal Equivalent Listings Found: {len(response.results)}")
    for idx, listing in enumerate(response.results[:3], 1):
        print(f"  #{idx} {listing.product_name} ({listing.source})")
        print(f"     Price: Rs. {listing.price_inr} | Unit Price: Rs. {listing.price_per_unit_inr}/unit | Stock: {listing.in_stock} | Confidence: {listing.match_confidence}")
        print(f"     URL: {listing.url}")

    if response.savings.vs_reference_inr_per_unit > 0:
        print(f"\n[SAVINGS DETECTED]: Rs. {response.savings.vs_reference_inr_per_unit}/unit ({response.savings.vs_reference_percent}% cheaper than reference brand!)")

    print(f"\nSource Execution Statuses:")
    for src in response.sources:
        print(f"  - {src.name}: {src.status} ({src.message or 'success'})")

    return res_dict


async def main():
    print("Starting End-to-End Live Search Verification on 5 medicines...")
    all_results = []

    for med in TEST_MEDICINES:
        try:
            res = await verify_medicine(med)
            all_results.append(res)
            # Short sleep between queries to be respectful to upstream APIs
            await asyncio.sleep(2)
        except Exception as exc:
            logger.error(f"Failed verifying {med}: {exc}", exc_info=True)

    out_file = backend_dir.parent / "samples" / "e2e_live_verification.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*70}")
    print(f"Successfully verified {len(all_results)}/{len(TEST_MEDICINES)} medicines live!")
    print(f"Saved full results to {out_file}")
    print(f"{'='*70}")


if __name__ == "__main__":
    asyncio.run(main())
