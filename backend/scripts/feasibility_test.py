"""Feasibility testing script for candidate pharmacy sources using TinyFish.

Performs one real call per candidate pharmacy, saves raw outputs to samples/,
and reports which sites work with Fetch, which require Agent/stealth, and which block us.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.services.tinyfish_client import TinyFishClient, TinyFishError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("feasibility_test")

CANDIDATE_PHARMACIES = [
    {
        "name": "Tata 1mg",
        "domain": "1mg.com",
        "test_query": "Crocin 650 tablet",
    },
    {
        "name": "Apollo Pharmacy",
        "domain": "apollopharmacy.in",
        "test_query": "Crocin 650 tablet",
    },
    {
        "name": "Netmeds",
        "domain": "netmeds.com",
        "test_query": "Crocin 650 tablet",
    },
    {
        "name": "PharmEasy",
        "domain": "pharmeasy.in",
        "test_query": "Crocin 650 tablet",
    },
    {
        "name": "Truemeds",
        "domain": "truemeds.com",
        "test_query": "Crocin 650 tablet",
    },
    {
        "name": "Zeelab Pharmacy",
        "domain": "zeelabpharmacy.com",
        "test_query": "paracetamol 650 tablet",
    },
]


async def test_pharmacy(client: TinyFishClient, pharmacy: dict[str, Any]) -> dict[str, Any]:
    name = pharmacy["name"]
    domain = pharmacy["domain"]
    query = pharmacy["test_query"]
    slug = domain.replace(".", "_")

    report: dict[str, Any] = {
        "name": name,
        "domain": domain,
        "search_status": "pending",
        "fetch_status": "pending",
        "stealth_needed": False,
        "working": False,
        "strategy": "fetch",
        "notes": "",
    }

    logger.info(f"--- Testing {name} ({domain}) ---")

    # 1. Search for medicine on this domain
    try:
        search_res = await client.search(
            query=f"site:{domain} {query}",
            location="IN",
            language="en",
        )
        client.save_sample(f"feasibility_search_{slug}.json", search_res)
        results = search_res.get("results", [])
        if results:
            report["search_status"] = "ok"
            top_url = results[0].get("url")
            report["sample_url"] = top_url
            logger.info(f"[{name}] Search found {len(results)} results. Top URL: {top_url}")
        else:
            report["search_status"] = "no_results"
            report["notes"] = "Search returned 0 results"
            logger.warning(f"[{name}] Search returned 0 results")
            return report
    except Exception as exc:
        report["search_status"] = f"failed: {exc}"
        report["notes"] = f"Search error: {exc}"
        logger.error(f"[{name}] Search failed: {exc}")
        return report

    # 2. Try Fetch on the top product URL
    try:
        logger.info(f"[{name}] Attempting Fetch on {top_url}...")
        fetch_res = await client.fetch(urls=[top_url], format="markdown", ttl=0)
        client.save_sample(f"feasibility_fetch_{slug}.json", fetch_res)

        fetch_results = fetch_res.get("results", [])
        fetch_errors = fetch_res.get("errors", [])

        if fetch_results and fetch_results[0].get("text"):
            text = fetch_results[0]["text"]
            text_len = len(text)
            logger.info(f"[{name}] Fetch succeeded ({text_len} chars extracted)")
            report["fetch_status"] = "ok"
            report["working"] = True
            report["strategy"] = "fetch"
            report["notes"] = f"Direct fetch succeeded ({text_len} chars extracted)"
            return report
        elif fetch_errors:
            err_code = fetch_errors[0].get("error", "unknown")
            logger.warning(f"[{name}] Fetch returned error: {err_code}")
            report["fetch_status"] = f"error: {err_code}"
            if "blocked" in err_code or "bot" in err_code:
                report["stealth_needed"] = True
    except Exception as exc:
        logger.warning(f"[{name}] Fetch failed with exception: {exc}")
        report["fetch_status"] = f"exception: {exc}"

    # 3. If Fetch failed or was blocked, test Agent with stealth profile
    try:
        logger.info(f"[{name}] Testing Agent with stealth profile on {top_url}...")
        agent_res = await client.run_agent(
            url=top_url,
            goal="Extract product name, price in INR, pack size, and salt composition. Return as JSON.",
            browser_profile="stealth",
            agent_config={"max_steps": 10},
        )
        client.save_sample(f"feasibility_agent_{slug}.json", agent_res)
        if agent_res.get("status") == "COMPLETED":
            logger.info(f"[{name}] Agent with stealth succeeded!")
            report["working"] = True
            report["strategy"] = "agent"
            report["stealth_needed"] = True
            report["notes"] = "Fetch blocked, but Agent with stealth mode succeeded"
        else:
            err = agent_res.get("error", {})
            report["working"] = False
            report["notes"] = f"Both Fetch and Agent failed: {err}"
    except Exception as exc:
        logger.error(f"[{name}] Agent test failed: {exc}")
        report["notes"] += f" | Agent error: {exc}"

    return report


async def main():
    api_key = settings.TINYFISH_API_KEY
    if not api_key:
        print("\n" + "=" * 60)
        print("ERROR: TINYFISH_API_KEY is not set.")
        print("Please set TINYFISH_API_KEY in .env before running feasibility tests.")
        print("=" * 60 + "\n")
        sys.exit(1)

    client = TinyFishClient(api_key=api_key)
    print(f"Starting feasibility test on {len(CANDIDATE_PHARMACIES)} candidate pharmacies...")

    reports = []
    for pharmacy in CANDIDATE_PHARMACIES:
        res = await test_pharmacy(client, pharmacy)
        reports.append(res)
        # Small delay between tests to respect rate limits
        await asyncio.sleep(2)

    # Save summary report
    summary_path = client.save_sample("feasibility_summary.json", reports)
    print("\n" + "=" * 60)
    print("FEASIBILITY TEST REPORT SUMMARY")
    print("=" * 60)
    working_sources = []
    for r in reports:
        status_symbol = "✅" if r["working"] else "❌"
        print(f"{status_symbol} {r['name']} ({r['domain']}): working={r['working']}, strategy={r['strategy']}, stealth={r['stealth_needed']}")
        print(f"   Notes: {r['notes']}\n")
        if r["working"]:
            working_sources.append(r)

    print(f"Total working sources: {len(working_sources)} / {len(reports)}")
    print(f"Detailed results saved to {summary_path}")


if __name__ == "__main__":
    asyncio.run(main())
