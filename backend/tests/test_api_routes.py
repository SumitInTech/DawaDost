from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_search_empty_query():
    response = client.post("/api/search", json={"query": "   "})
    assert response.status_code == 400


def test_search_unknown_medicine():
    response = client.post("/api/search", json={"query": "NonExistentUnknownMed12345"})
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "NonExistentUnknownMed12345"
    assert data["results"] == []
    assert len(data["warnings"]) > 0
    assert "disclaimer" in data


def test_search_cached_flow():
    from app.services.cache import cache_service

    query = "Crocin 650"
    mock_payload = {
        "query": query,
        "resolved": {
            "brand": "Crocin 650",
            "salts": ["paracetamol"],
            "strength": "650 mg",
            "form": "tablet",
        },
        "reference_listing": {
            "source": "Tata 1mg",
            "product_name": "Crocin 650mg Tablet",
            "brand": "Crocin",
            "salts": ["paracetamol"],
            "strength": "650 mg",
            "form": "tablet",
            "pack_size_units": 15,
            "price_inr": 32.28,
            "price_per_unit_inr": 2.15,
            "in_stock": True,
            "url": "https://www.1mg.com/drugs/crocin-650mg-tablet-90532",
            "fetched_at": "2026-10-19T14:00:00Z",
            "cached": True,
            "is_reference_brand": True,
            "match_confidence": 1.0,
            "flags": [],
        },
        "results": [
            {
                "source": "Tata 1mg",
                "product_name": "Crocin 650mg Tablet",
                "brand": "Crocin",
                "salts": ["paracetamol"],
                "strength": "650 mg",
                "form": "tablet",
                "pack_size_units": 15,
                "price_inr": 32.28,
                "price_per_unit_inr": 2.15,
                "in_stock": True,
                "url": "https://www.1mg.com/drugs/crocin-650mg-tablet-90532",
                "fetched_at": "2026-10-19T14:00:00Z",
                "cached": True,
                "is_reference_brand": True,
                "match_confidence": 1.0,
                "flags": [],
            }
        ],
        "savings": {
            "vs_reference_inr_per_unit": 0.0,
            "vs_reference_percent": 0.0,
        },
        "sources": [
            {
                "name": "Tata 1mg",
                "status": "cached",
                "fetched_at": "2026-10-19T14:00:00Z",
                "message": None,
            }
        ],
        "warnings": [],
        "disclaimer": "Prices are indicative. Confirm the medicine, strength and availability with your pharmacist or doctor before buying.",
    }
    cache_service.set_search(query, mock_payload)

    response = client.post("/api/search", json={"query": query})
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == query
    assert data["reference_listing"]["price_per_unit_inr"] == 2.15
    assert len(data["results"]) == 1
    assert data["sources"][0]["status"] == "cached"
