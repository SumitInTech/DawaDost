"""Deterministic Pricing Engine for Dawa Dost.

All arithmetic (unit price, savings calculation, percentages) is computed in plain Python.
Per Hard Design Rule 1: The LLM NEVER computes prices, unit prices, or savings.
"""

from __future__ import annotations

import logging
from typing import Sequence
from app.models.schemas import ExtractedListing, Listing, SavingsSummary

logger = logging.getLogger(__name__)


def calculate_unit_price(
    price_inr: float,
    pack_size_units: float | None,
    flags: list[str] | None = None,
) -> tuple[float | None, list[str]]:
    """Calculates price per unit (per tablet, capsule, or ml).

    Returns (price_per_unit_inr, updated_flags).
    If pack_size_units is missing or <= 0: leaves price_per_unit_inr as None
    and appends 'pack_size_unclear' to flags.
    """
    updated_flags = list(flags or [])

    if pack_size_units is None or pack_size_units <= 0:
        if "pack_size_unclear" not in updated_flags:
            updated_flags.append("pack_size_unclear")
        return None, updated_flags

    if price_inr <= 0:
        if "invalid_price" not in updated_flags:
            updated_flags.append("invalid_price")
        return None, updated_flags

    unit_price = round(price_inr / pack_size_units, 2)
    return unit_price, updated_flags


def compute_savings(
    reference_listing: Listing | None,
    cheapest_equivalent: Listing | None,
) -> SavingsSummary:
    """Calculates price savings vs the searched reference brand.

    vs_reference_inr_per_unit = reference.price_per_unit_inr - cheapest.price_per_unit_inr
    vs_reference_percent = (savings / reference.price_per_unit_inr) * 100
    """
    if not reference_listing or not reference_listing.price_per_unit_inr:
        return SavingsSummary(vs_reference_inr_per_unit=0.0, vs_reference_percent=0.0)

    if not cheapest_equivalent or not cheapest_equivalent.price_per_unit_inr:
        return SavingsSummary(vs_reference_inr_per_unit=0.0, vs_reference_percent=0.0)

    ref_unit_price = reference_listing.price_per_unit_inr
    best_unit_price = cheapest_equivalent.price_per_unit_inr

    savings_inr = round(max(0.0, ref_unit_price - best_unit_price), 2)
    savings_pct = round((savings_inr / ref_unit_price) * 100, 1) if ref_unit_price > 0 else 0.0

    return SavingsSummary(
        vs_reference_inr_per_unit=savings_inr,
        vs_reference_percent=savings_pct,
    )


def sort_listings_by_price(listings: Sequence[Listing]) -> list[Listing]:
    """Ranks listings strictly by price_per_unit_inr ascending.

    Listings with unclear pack size (price_per_unit_inr is None) are placed at the end.
    """
    comparable = [lst for lst in listings if lst.price_per_unit_inr is not None]
    unclear = [lst for lst in listings if lst.price_per_unit_inr is None]

    sorted_comparable = sorted(comparable, key=lambda x: x.price_per_unit_inr)  # type: ignore[arg-type]
    return sorted_comparable + unclear
