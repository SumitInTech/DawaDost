import json
from pathlib import Path
import pytest

from app.services.extraction import extraction_service

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"


@pytest.mark.asyncio
async def test_extraction_on_real_1mg_sample():
    sample_file = SAMPLES_DIR / "feasibility_fetch_1mg_com.json"
    if not sample_file.exists():
        pytest.skip("feasibility_fetch_1mg_com.json not present")

    with open(sample_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = data.get("results", [])
    assert len(results) > 0
    raw_text = results[0].get("text", "")

    extracted = await extraction_service.extract_listing(
        raw_text=raw_text,
        source="Tata 1mg",
        url="https://www.1mg.com/drugs/crocin-650mg-tablet-90532",
    )

    assert extracted is not None
    assert "crocin" in extracted.product_name.lower()
    assert extracted.price_inr > 0
    assert "paracetamol" in extracted.salts
    assert extracted.form == "tablet"
