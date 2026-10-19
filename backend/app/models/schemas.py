"""Pydantic data models for Dawa Dost API and internal pipeline.

Defined in strict compliance with Context.txt Sections 8 and 9.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator


class ExtractedListing(BaseModel):
    """Raw structured data extracted from a pharmacy page by LLM or Agent.

    Contains no computed pricing or match decision fields.
    """
    source: str = Field(..., description="Pharmacy name (e.g. 'Tata 1mg')")
    product_name: str = Field(..., description="Full product name from pharmacy site")
    brand: str | None = Field(None, description="Brand name if identifiable")
    salts: list[str] = Field(default_factory=list, description="Active chemical salt composition (lowercase)")
    strength: str = Field(..., description="Normalised strength (e.g. '500 mg', '650 mg')")
    form: str = Field(..., description="Dosage form: tablet, capsule, syrup, suspension, injection, etc.")
    pack_size_units: float | None = Field(None, description="Count of units in pack (e.g. 10 tablets, 100 ml)")
    price_inr: float = Field(..., description="Total pack price in Indian Rupees")
    in_stock: bool | None = Field(None, description="True=in stock, False=out of stock, None=unknown")
    url: str = Field(..., description="Direct product URL")
    flags: list[str] = Field(default_factory=list, description="Quality flags (e.g. 'pack_size_unclear')")

    @field_validator("salts", mode="before")
    @classmethod
    def normalize_salts(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [s.strip().lower() for s in v.replace("+", ",").split(",") if s.strip()]
        if isinstance(v, list):
            return [str(s).strip().lower() for s in v if str(s).strip()]
        return []

    @field_validator("price_inr", mode="before")
    @classmethod
    def normalize_price(cls, v: Any) -> float:
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            import re
            clean = re.sub(r"[^\d.]", "", v)
            if clean:
                return float(clean)
        raise ValueError(f"Invalid price value: {v}")

    @field_validator("pack_size_units", mode="before")
    @classmethod
    def normalize_pack_size(cls, v: Any) -> float | None:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v) if v > 0 else None
        if isinstance(v, str):
            import re
            clean = re.sub(r"[^\d.]", "", v)
            if clean:
                try:
                    f = float(clean)
                    return f if f > 0 else None
                except ValueError:
                    return None
        return None

    @field_validator("form", mode="before")
    @classmethod
    def normalize_form(cls, v: Any) -> str:
        s = str(v).strip().lower()
        if "tab" in s:
            return "tablet"
        if "cap" in s:
            return "capsule"
        if "syr" in s:
            return "syrup"
        if "susp" in s:
            return "suspension"
        if "drop" in s:
            return "drops"
        if "gel" in s or "oint" in s:
            return "gel"
        if "inj" in s:
            return "injection"
        return s or "tablet"


class Listing(BaseModel):
    """Final enriched listing with computed unit prices and equivalence confidence."""
    source: str
    product_name: str
    brand: str | None = None
    salts: list[str] = Field(default_factory=list)
    strength: str
    form: str
    pack_size_units: float | None = None
    price_inr: float
    price_per_unit_inr: float | None = Field(None, description="Computed in pricing.py, NEVER by LLM")
    in_stock: bool | None = None
    delivery_pincode: str | None = Field(None, description="Pincode checked for delivery")
    delivery_info: str | None = Field(None, description="Estimated delivery timeline or status for pincode")
    url: str
    fetched_at: datetime = Field(..., description="ISO 8601 UTC timestamp")
    cached: bool = False
    is_reference_brand: bool = False
    match_confidence: float = Field(1.0, ge=0.0, le=1.0)
    flags: list[str] = Field(default_factory=list)


class ResolvedMedicine(BaseModel):
    """Resolution of brand name to active salt, strength and form."""
    brand: str | None = None
    salts: list[str] = Field(default_factory=list)
    strength: str
    form: str
    resolved_by: Literal["local_table", "llm"] = "local_table"


class SourceStatus(BaseModel):
    """Execution status for an individual pharmacy source."""
    name: str
    status: Literal["ok", "failed", "cached", "blocked"]
    fetched_at: datetime
    message: str | None = None


class SavingsSummary(BaseModel):
    """Computed savings vs searched reference brand."""
    vs_reference_inr_per_unit: float = 0.0
    vs_reference_percent: float = 0.0


class SearchRequest(BaseModel):
    """Request payload for POST /api/search with mandatory Indian pincode."""
    query: str = Field(..., min_length=1, description="Brand or salt name")
    pincode: str = Field(
        ...,
        pattern=r"^[1-9][0-9]{5}$",
        description="Mandatory 6-digit Indian delivery pincode (e.g. 110006)",
    )


class SearchResponse(BaseModel):
    """Response payload for POST /api/search strictly per Section 8."""
    query: str
    pincode: str
    resolved: ResolvedMedicine
    reference_listing: Listing | None = None
    results: list[Listing] = Field(default_factory=list, description="Sorted by price_per_unit_inr ascending")
    savings: SavingsSummary = Field(default_factory=SavingsSummary)
    sources: list[SourceStatus] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="Prices are indicative. Confirm the medicine, strength and availability with your pharmacist or doctor before buying."
    )
