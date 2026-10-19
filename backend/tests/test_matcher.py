import pytest
from app.models.schemas import ExtractedListing, ResolvedMedicine
from app.services.matcher import (
    are_forms_equivalent,
    are_salts_equivalent,
    are_strengths_equivalent,
    match_listing,
    normalize_strength_to_mg,
)


def test_normalize_strength_units():
    assert normalize_strength_to_mg("500mg") == "500 mg"
    assert normalize_strength_to_mg("0.5 g") == "500 mg"
    assert normalize_strength_to_mg("1 g") == "1000 mg"
    assert normalize_strength_to_mg("1000 mg") == "1000 mg"
    assert normalize_strength_to_mg("500 mg + 125 mg") == "125 mg + 500 mg"


def test_salts_equivalence_strict_exact_match():
    # Single salt
    assert are_salts_equivalent(["paracetamol"], ["paracetamol"])
    assert not are_salts_equivalent(["paracetamol"], ["ibuprofen"])

    # Combination salts: both salts must match exactly
    assert are_salts_equivalent(
        ["amoxicillin", "clavulanic acid"],
        ["clavulanic acid", "amoxicillin"],
    )
    # Partial match must FAIL (e.g. only amoxicillin != amoxicillin + clavulanic acid)
    assert not are_salts_equivalent(
        ["amoxicillin"],
        ["amoxicillin", "clavulanic acid"],
    )


def test_form_equivalence():
    assert are_forms_equivalent("tablet", "tablet")
    assert are_forms_equivalent("Tablet", "tab")
    assert are_forms_equivalent("Capsule", "cap")
    # Tablet != Capsule
    assert not are_forms_equivalent("tablet", "capsule")
    # Solid != Liquid
    assert not are_forms_equivalent("tablet", "syrup")


def test_strength_equivalence_metric_conversion():
    # 500 mg == 0.5 g
    assert are_strengths_equivalent("500 mg", "0.5 g")
    assert are_strengths_equivalent("650 mg", "650mg")
    # 500 mg != 650 mg
    assert not are_strengths_equivalent("500 mg", "650 mg")


def test_full_match_listing():
    resolved = ResolvedMedicine(
        brand="Crocin 650",
        salts=["paracetamol"],
        strength="650 mg",
        form="tablet",
    )

    # Valid equivalent (Dolo 650)
    good_listing = ExtractedListing(
        source="Apollo Pharmacy",
        product_name="Dolo 650mg Tablet",
        brand="Dolo",
        salts=["paracetamol"],
        strength="650 mg",
        form="tablet",
        pack_size_units=15,
        price_inr=31.0,
        url="https://example.com/dolo",
    )
    is_equiv, confidence, flags = match_listing(good_listing, resolved)
    assert is_equiv is True
    assert confidence >= 0.8
    assert "low_confidence" not in flags

    # Different strength (500 mg instead of 650 mg)
    diff_strength = ExtractedListing(
        source="1mg",
        product_name="Calpol 500mg Tablet",
        brand="Calpol",
        salts=["paracetamol"],
        strength="500 mg",
        form="tablet",
        pack_size_units=15,
        price_inr=15.0,
        url="https://example.com/calpol",
    )
    is_equiv, confidence, flags = match_listing(diff_strength, resolved)
    assert is_equiv is False
    assert "different_strength" in flags

    # Different form (Syrup instead of Tablet)
    diff_form = ExtractedListing(
        source="Netmeds",
        product_name="Crocin Suspension",
        brand="Crocin",
        salts=["paracetamol"],
        strength="650 mg",
        form="syrup",
        pack_size_units=60,
        price_inr=40.0,
        url="https://example.com/crocin-syr",
    )
    is_equiv, confidence, flags = match_listing(diff_form, resolved)
    assert is_equiv is False
    assert "different_form" in flags
