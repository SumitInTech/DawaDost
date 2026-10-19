import pytest
from app.services.salt_resolver import SaltResolver


@pytest.mark.asyncio
async def test_salt_resolver_exact_match():
    resolver = SaltResolver()
    res = await resolver.resolve("Crocin 650")
    assert res is not None
    assert res.brand == "Crocin 650"
    assert res.salts == ["paracetamol"]
    assert res.strength == "650 mg"
    assert res.form == "tablet"
    assert res.resolved_by == "local_table"


@pytest.mark.asyncio
async def test_salt_resolver_known_equivalent():
    resolver = SaltResolver()
    # Dolo 650 is a known equivalent of Crocin 650
    res = await resolver.resolve("Dolo 650")
    assert res is not None
    assert "paracetamol" in res.salts
    assert res.strength == "650 mg"


@pytest.mark.asyncio
async def test_salt_resolver_combination_medicine():
    resolver = SaltResolver()
    res = await resolver.resolve("Augmentin 625 Duo")
    assert res is not None
    assert set(res.salts) == {"amoxicillin", "clavulanic acid"}
    assert res.strength == "500 mg + 125 mg"
    assert res.form == "tablet"


@pytest.mark.asyncio
async def test_salt_resolver_unknown_without_llm():
    # An entirely unknown/gibberish name should return None without guessing
    resolver = SaltResolver()
    res = await resolver.resolve("NonExistentMedicineXyz999")
    assert res is None
