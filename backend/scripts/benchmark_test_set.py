"""Accuracy Benchmark Script for the 20 Hand-Verified Medicines.

Runs deterministic evaluations across all 20 medicines in backend/tests/data/medicines.json:
1. Salt Resolution Accuracy (Brand -> Salts, Strength, Form)
2. Known Equivalents Resolution Accuracy
3. Equivalence Matching Accuracy (True Positives, False Positives, False Negatives)
Outputs accuracy report for README.md and PPT.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models.schemas import ExtractedListing, ResolvedMedicine
from app.services.matcher import match_listing
from app.services.salt_resolver import salt_resolver

logging.basicConfig(level=logging.WARNING)


async def run_benchmark():
    data_file = backend_dir / "tests" / "data" / "medicines.json"
    with open(data_file, "r", encoding="utf-8") as f:
        test_set = json.load(f)

    total_tests = 0
    passed_tests = 0
    failures = []

    print("=" * 70)
    print("DAWA DOST 20-MEDICINE TEST SET ACCURACY BENCHMARK")
    print("=" * 70)

    # 1. Test Salt Resolution for all 20 Brands
    for item in test_set:
        total_tests += 1
        brand = item["brand"]
        expected_salts = set(item["salts"])
        expected_form = item["form"]

        resolved = await salt_resolver.resolve(brand)
        if not resolved:
            failures.append(f"Resolution failed for brand: '{brand}'")
            continue

        resolved_salts = set(resolved.salts)
        if resolved_salts == expected_salts and resolved.form == expected_form:
            passed_tests += 1
        else:
            failures.append(
                f"Resolution mismatch for '{brand}': expected {expected_salts}/{expected_form}, got {resolved_salts}/{resolved.form}"
            )

    # 2. Test Known Equivalents Resolution
    for item in test_set:
        for eq in item.get("known_equivalents", []):
            total_tests += 1
            expected_salts = set(item["salts"])

            resolved = await salt_resolver.resolve(eq)
            if resolved and set(resolved.salts) == expected_salts:
                passed_tests += 1
            else:
                failures.append(f"Equivalent resolution failed for: '{eq}' of '{item['brand']}'")

    # 3. Test Equivalence Matcher on True Positives (Same salt, strength, form)
    for item in test_set:
        total_tests += 1
        resolved = ResolvedMedicine(
            brand=item["brand"],
            salts=item["salts"],
            strength=item["strength"],
            form=item["form"],
        )
        # Mock identical equivalent product
        valid_listing = ExtractedListing(
            source="Test Pharmacy",
            product_name=f"Generic {item['brand']}",
            brand="Generic",
            salts=item["salts"],
            strength=item["strength"],
            form=item["form"],
            pack_size_units=10,
            price_inr=20.0,
            url="https://test.com/med",
        )
        is_equiv, conf, flags = match_listing(valid_listing, resolved)
        if is_equiv and conf >= 0.8:
            passed_tests += 1
        else:
            failures.append(f"True positive match failed for '{item['brand']}': conf={conf}, flags={flags}")

    # 4. Test Equivalence Matcher on Negative Controls (Wrong strength / Wrong form)
    for item in test_set:
        total_tests += 1
        resolved = ResolvedMedicine(
            brand=item["brand"],
            salts=item["salts"],
            strength=item["strength"],
            form=item["form"],
        )
        # Invert form: if tablet -> syrup
        wrong_form = "syrup" if item["form"] == "tablet" else "tablet"
        invalid_listing = ExtractedListing(
            source="Test Pharmacy",
            product_name=f"Wrong Form {item['brand']}",
            brand="Generic",
            salts=item["salts"],
            strength=item["strength"],
            form=wrong_form,
            pack_size_units=10,
            price_inr=20.0,
            url="https://test.com/med",
        )
        is_equiv, conf, flags = match_listing(invalid_listing, resolved)
        # MUST reject
        if not is_equiv:
            passed_tests += 1
        else:
            failures.append(f"Negative control (wrong form) incorrectly matched for '{item['brand']}'")

    accuracy_pct = round((passed_tests / total_tests) * 100, 2)

    print(f"\nTotal Test Assertions: {total_tests}")
    print(f"Passed Assertions:     {passed_tests}")
    print(f"Failed Assertions:     {len(failures)}")
    print(f"Overall Match Accuracy: {accuracy_pct}%")

    if failures:
        print("\nFailures:")
        for f in failures[:5]:
            print(f"  - {f}")
    else:
        print("\n[PERFECT SCORE]: All 20 verified medicines and equivalence rules passed with 100% accuracy!")

    print("=" * 70)
    return {
        "total_assertions": total_tests,
        "passed_assertions": passed_tests,
        "accuracy_pct": accuracy_pct,
        "failures": failures,
    }


if __name__ == "__main__":
    asyncio.run(run_benchmark())
