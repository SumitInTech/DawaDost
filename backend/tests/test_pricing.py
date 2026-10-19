from datetime import datetime, timezone
import pytest

from app.models.schemas import Listing, SavingsSummary
from app.services.pricing import (
    calculate_unit_price,
    compute_savings,
    sort_listings_by_price,
)


def test_calculate_unit_price_solid_form():
    # 15 tablets for 32.28 INR -> 2.15 INR / tablet
    unit_price, flags = calculate_unit_price(price_inr=32.28, pack_size_units=15)
    assert unit_price == 2.15
    assert "pack_size_unclear" not in flags


def test_calculate_unit_price_missing_pack_size():
    unit_price, flags = calculate_unit_price(price_inr=30.0, pack_size_units=None)
    assert unit_price is None
    assert "pack_size_unclear" in flags


def test_calculate_unit_price_zero_or_negative():
    unit_price, flags = calculate_unit_price(price_inr=0.0, pack_size_units=10)
    assert unit_price is None
    assert "invalid_price" in flags


def test_compute_savings():
    now = datetime.now(timezone.utc)
    ref = Listing(
        source="1mg",
        product_name="Crocin 650",
        strength="650 mg",
        form="tablet",
        price_inr=32.28,
        pack_size_units=15,
        price_per_unit_inr=2.15,
        url="https://example.com/crocin",
        fetched_at=now,
    )
    generic = Listing(
        source="Apollo",
        product_name="Dolo 650",
        strength="650 mg",
        form="tablet",
        price_inr=15.0,
        pack_size_units=15,
        price_per_unit_inr=1.00,
        url="https://example.com/dolo",
        fetched_at=now,
    )

    savings = compute_savings(ref, generic)
    # Savings: 2.15 - 1.00 = 1.15 INR per unit
    assert savings.vs_reference_inr_per_unit == 1.15
    # Percent: (1.15 / 2.15) * 100 = 53.5%
    assert savings.vs_reference_percent == pytest.approx(53.5, rel=1e-1)


def test_sort_listings_by_price():
    now = datetime.now(timezone.utc)
    l1 = Listing(
        source="A",
        product_name="Med A",
        strength="500 mg",
        form="tablet",
        price_inr=50.0,
        pack_size_units=10,
        price_per_unit_inr=5.0,
        url="https://a.com",
        fetched_at=now,
    )
    l2 = Listing(
        source="B",
        product_name="Med B",
        strength="500 mg",
        form="tablet",
        price_inr=20.0,
        pack_size_units=10,
        price_per_unit_inr=2.0,
        url="https://b.com",
        fetched_at=now,
    )
    l3 = Listing(
        source="C",
        product_name="Med C",
        strength="500 mg",
        form="tablet",
        price_inr=30.0,
        pack_size_units=None,
        price_per_unit_inr=None,
        url="https://c.com",
        fetched_at=now,
    )

    sorted_list = sort_listings_by_price([l1, l3, l2])
    # Cheapest unit price first: l2 (2.0), then l1 (5.0), then unclear pack size at the end l3 (None)
    assert sorted_list[0].product_name == "Med B"
    assert sorted_list[1].product_name == "Med A"
    assert sorted_list[2].product_name == "Med C"
