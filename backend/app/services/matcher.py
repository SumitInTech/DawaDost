"""Equivalence Matcher and Confidence Scorer for Dawa Dost.

Enforces strict bio-equivalence rules:
1. Exact identical set of salts (combination products must match completely).
2. Equivalent strength after normalisation (e.g. '0.5 g' == '500 mg').
3. Identical dosage form (tablet != capsule != syrup).
Per Section 4 Hard Rule 1: All match decisions and arithmetic are in plain Python.
"""

from __future__ import annotations

import logging
import re
from typing import Sequence

from app.models.schemas import ExtractedListing, Listing, ResolvedMedicine

logger = logging.getLogger(__name__)

# Minimum confidence threshold to avoid flagging as 'low_confidence'
CONFIDENCE_THRESHOLD = 0.80


def normalize_strength_to_mg(strength_str: str) -> str:
    """Normalises strength representations.

    e.g. '0.5 g' -> '500 mg', '650mg' -> '650 mg', '1000 mg' -> '1000 mg'.
    Handles combination strengths like '500 mg + 125 mg'.
    """
    clean = strength_str.strip().lower()
    if not clean or clean == "standard":
        return "standard"

    parts = [p.strip() for p in clean.split("+")]
    normalized_parts = []

    for part in parts:
        # Match number and unit
        m = re.match(r"([0-9]+(?:\.[0-9]+)?)\s*(mg|g|mcg|iu|ml)?", part)
        if not m:
            normalized_parts.append(part)
            continue

        val_str, unit = m.group(1), m.group(2) or "mg"
        val = float(val_str)

        if unit == "g":
            # Convert grams to mg
            val = val * 1000
            unit = "mg"
        elif unit == "mcg":
            # Keep as mcg or fraction
            val = val / 1000
            unit = "mg"

        # Format number: remove trailing .0 if integer
        formatted_val = f"{int(val)}" if val.is_integer() else f"{val:.2f}"
        normalized_parts.append(f"{formatted_val} {unit}")

    return " + ".join(sorted(normalized_parts))


def are_salts_equivalent(salts_a: Sequence[str], salts_b: Sequence[str]) -> bool:
    """Check if two salt sets are completely identical.

    Combination products must match exactly (set A == set B).
    """
    set_a = {s.strip().lower() for s in salts_a if s.strip()}
    set_b = {s.strip().lower() for s in salts_b if s.strip()}

    if not set_a or not set_b:
        return False

    return set_a == set_b


def are_forms_equivalent(form_a: str, form_b: str) -> bool:
    """Check if dosage forms match strictly (tablet != capsule != syrup)."""
    fa = form_a.strip().lower()
    fb = form_b.strip().lower()

    if "tab" in fa and "tab" in fb:
        return True
    if "cap" in fa and "cap" in fb:
        return True
    if "syr" in fa and "syr" in fb:
        return True
    if "inj" in fa and "inj" in fb:
        return True

    return fa == fb


def are_strengths_equivalent(strength_a: str, strength_b: str) -> bool:
    """Check if dosage strengths match after metric normalization."""
    sa = normalize_strength_to_mg(strength_a)
    sb = normalize_strength_to_mg(strength_b)

    if sa == "standard" or sb == "standard":
        return True

    return sa == sb


def calculate_match_confidence(
    extracted: ExtractedListing,
    resolved: ResolvedMedicine,
    salts_match: bool,
    strength_match: bool,
    form_match: bool,
) -> tuple[float, list[str]]:
    """Calculates match confidence between 0.0 and 1.0 based on rule agreement and completeness."""
    flags = list(extracted.flags)
    score = 1.0

    # If any core equivalence fails, confidence drops severely
    if not salts_match:
        score -= 0.60
        flags.append("different_salts")

    if not strength_match:
        score -= 0.30
        flags.append("different_strength")

    if not form_match:
        score -= 0.20
        flags.append("different_form")

    # Completeness penalties
    if not extracted.salts:
        score -= 0.20
        flags.append("missing_salts_info")

    if extracted.strength == "standard":
        score -= 0.10
        flags.append("unspecified_strength")

    if extracted.pack_size_units is None:
        flags.append("pack_size_unclear")

    confidence = round(max(0.0, min(1.0, score)), 2)

    if confidence < CONFIDENCE_THRESHOLD and "low_confidence" not in flags:
        flags.append("low_confidence")

    return confidence, flags


def match_listing(
    extracted: ExtractedListing,
    resolved: ResolvedMedicine,
    is_reference: bool = False,
) -> tuple[bool, float, list[str]]:
    """Evaluates whether an extracted listing is an equivalent substitute.

    Returns (is_equivalent, match_confidence, flags).
    """
    salts_match = are_salts_equivalent(extracted.salts, resolved.salts)
    strength_match = are_strengths_equivalent(extracted.strength, resolved.strength)
    form_match = are_forms_equivalent(extracted.form, resolved.form)

    is_equiv = salts_match and strength_match and form_match

    confidence, flags = calculate_match_confidence(
        extracted, resolved, salts_match, strength_match, form_match
    )

    return is_equiv, confidence, flags
