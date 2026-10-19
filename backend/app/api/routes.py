"""API Routes for Dawa Dost.

Exposes GET /api/health and POST /api/search in strict compliance with Context.txt Section 8.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    Listing,
    ResolvedMedicine,
    SavingsSummary,
    SearchRequest,
    SearchResponse,
    SourceStatus,
)
from app.services.cache import cache_service
from app.services.extraction import extraction_service
from app.services.matcher import match_listing
from app.services.pricing import calculate_unit_price, compute_savings, sort_listings_by_price
from app.services.salt_resolver import salt_resolver
from app.services.sources import source_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@router.post("/search", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_medicines(req: SearchRequest) -> SearchResponse:
    """Search for medicine generic equivalents and compare per-unit prices across pharmacies."""
    clean_query = req.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    pincode = req.pincode.strip() if req.pincode else None

    # 1. Check Cache
    cached_entry = cache_service.get_search(clean_query, pincode)
    if cached_entry:
        logger.info(f"Serving cached search result for query '{clean_query}'")
        try:
            # Mark sources as cached
            if "sources" in cached_entry:
                for s in cached_entry["sources"]:
                    s["status"] = "cached"
            return SearchResponse(**cached_entry)
        except Exception as exc:
            logger.warning(f"Failed to parse cached entry, re-fetching: {exc}")

    # 2. Resolve Brand / Query to Active Chemical Salts, Strength and Form
    resolved = await salt_resolver.resolve(clean_query)
    warnings: list[str] = []

    if not resolved:
        # Return 200 with empty results and warning per Section 8
        return SearchResponse(
            query=clean_query,
            resolved=ResolvedMedicine(
                brand=clean_query,
                salts=[],
                strength="unknown",
                form="unknown",
            ),
            reference_listing=None,
            results=[],
            savings=SavingsSummary(),
            sources=[],
            warnings=["Could not resolve medicine active salt composition. Never guessing."],
        )

    if resolved.resolved_by == "llm":
        warnings.append("Salt composition resolved via AI fallback. Verify with your doctor or pharmacist.")

    # 3. Concurrent Fetch from Configured Sources
    source_statuses, raw_pages = await source_orchestrator.fetch_all_sources(
        resolved=resolved,
        query=clean_query,
        pincode=pincode,
    )

    # 4. Extract, Match, and Price Listings
    listings: list[Listing] = []
    reference_candidates: list[Listing] = []
    now = datetime.now(timezone.utc)

    for page in raw_pages:
        raw_text = page.get("markdown_text", "")
        source_name = page.get("source", "")
        url = page.get("url", "")

        extracted = await extraction_service.extract_listing(raw_text, source_name, url)
        if not extracted:
            continue

        # Check equivalence
        is_equiv, match_conf, flags = match_listing(extracted, resolved)

        # Calculate unit price in Python
        unit_price, updated_flags = calculate_unit_price(
            extracted.price_inr,
            extracted.pack_size_units,
            flags,
        )

        # Check if this is the reference brand searched by the user
        is_ref = False
        if resolved.brand and resolved.brand.lower() in extracted.product_name.lower():
            is_ref = True

        listing = Listing(
            source=extracted.source,
            product_name=extracted.product_name,
            brand=extracted.brand,
            salts=extracted.salts,
            strength=extracted.strength,
            form=extracted.form,
            pack_size_units=extracted.pack_size_units,
            price_inr=extracted.price_inr,
            price_per_unit_inr=unit_price,
            in_stock=extracted.in_stock,
            url=extracted.url,
            fetched_at=now,
            cached=False,
            is_reference_brand=is_ref,
            match_confidence=match_conf,
            flags=updated_flags,
        )

        if is_ref:
            reference_candidates.append(listing)

        # Keep listing if it's strictly equivalent OR if it is the reference brand
        if is_equiv or is_ref:
            listings.append(listing)

    # 5. Select Best Reference Listing
    reference_listing = None
    if reference_candidates:
        # Choose candidate with valid unit price first
        comparable_refs = [r for r in reference_candidates if r.price_per_unit_inr is not None]
        reference_listing = comparable_refs[0] if comparable_refs else reference_candidates[0]

    # 6. Rank Results strictly by price per unit ascending
    sorted_results = sort_listings_by_price(listings)

    # 7. Compute Savings
    cheapest_equiv = next((l for l in sorted_results if not l.is_reference_brand and l.price_per_unit_inr is not None), None)
    savings = compute_savings(reference_listing, cheapest_equiv)

    response = SearchResponse(
        query=clean_query,
        resolved=resolved,
        reference_listing=reference_listing,
        results=sorted_results,
        savings=savings,
        sources=source_statuses,
        warnings=warnings,
    )

    # 8. Save to Cache
    cache_service.set_search(clean_query, response.model_dump(mode="json"), pincode)

    return response
