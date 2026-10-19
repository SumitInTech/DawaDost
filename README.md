# Dawa Dost (दवा दोस्त) 💊🤝

> "Medicine friend" — finding cheaper, generic-equivalent medicines with real live pharmacy prices and transparent unit-pricing.

Built for **Kritical Hacks 2026** (IGDTUW, Delhi) — AI/ML Track.

---

## 🌟 What Dawa Dost Is

Dawa Dost is an intelligent medicine price comparison and equivalence engine:
1. **Resolves** branded medicines to their active salt composition, dosage/strength, and dosage form.
2. **Searches live pharmacy websites** via **TinyFish** (Search, Fetch, and Web Agent).
3. **Extracts structured listings** (brand, salts, strength, form, pack size, price, stock).
4. **Matches strict generic equivalents** (same salt, same strength, same form).
5. **Calculates price per unit** (e.g., per tablet, capsule, or ml) to normalize disparate pack sizes.
6. **Ranks transparently** by price per unit and displays real-time savings versus the branded reference.

> ⚠️ **Important Safety Disclaimer**: Dawa Dost does not sell medicines, does not take payments, and **provides no medical advice**. Equivalence is based strictly on chemical composition, strength, and form. Always confirm with a qualified doctor or licensed pharmacist before switching medications.

---

## 🚀 How We Use TinyFish

TinyFish is the live web backbone of Dawa Dost. We use three TinyFish API surfaces:
- **Search API (`api.search.tinyfish.ai`)**: Geo-targeted search across Indian online pharmacies to discover active product listing URLs for the searched medicine and its active salt equivalents.
- **Fetch API (`api.fetch.tinyfish.ai`)**: High-speed, clean markdown extraction of static and dynamic medicine product pages without running heavyweight browser agents for standard pages.
- **Web Agent API (`agent.tinyfish.ai/v1/automation/run`)**: Multi-step AI browser automation with stealth anti-detection profiles and proxy support to navigate interactive pharmacy websites (e.g. entering pincodes, selecting pack sizes, bypassing bot challenges).

All TinyFish integration is centralized in [`backend/app/services/tinyfish_client.py`](backend/app/services/tinyfish_client.py).

---

## 🛠️ Architecture

```
React UI  ->  FastAPI Backend  ->  TinyFish (Search / Fetch / Agent)  ->  Pharmacy Sites
                   |                                                               |
                   |<--- Clean page content / Structured output -------------------|
                   v
           LLM Extraction (Raw text -> ExtractedListing)
                   v
           Deterministic Python Matcher (Salt + Strength + Form) & Unit Price Math
                   v
           Ranked Results (+ Savings, Confidence, Fetched-at)  ->  Frontend UI
                   ^
           SQLite Cache (Timestamped, TTL, USE_CACHE_ONLY fallback)
```

---

## 💻 How to Run

### Prerequisites
- Python 3.11+
- TinyFish API Key ([agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys))

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/dawa-dost.git
cd dawa-dost

# Copy environment template
cp .env.example .env
# Edit .env and set TINYFISH_API_KEY, LLM_API_KEY, etc.

# Install dependencies
cd backend
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

### Running Tests
```bash
cd backend
pytest -v
```

---

## 📂 Project Structure

- `backend/app/api/`: FastAPI routing (`/api/health`, `/api/search`).
- `backend/app/models/`: Pydantic data schemas (`Listing`, `ExtractedListing`, search requests/responses).
- `backend/app/services/`: Core logic modules:
  - `tinyfish_client.py`: Search, Fetch, and Agent integration.
  - `sources.py`: Parallel pharmacy source orchestration.
  - `extraction.py`: LLM-based structured extraction.
  - `salt_resolver.py`: Brand to salt resolver with local seed table & LLM fallback.
  - `matcher.py`: Strict chemical equivalence validation.
  - `pricing.py`: Unit price calculation & savings math.
  - `cache.py`: SQLite persistence and `USE_CACHE_ONLY` demo mode.
- `samples/`: Raw TinyFish responses captured from real pharmacy sites.
- `docs/`: Architecture diagrams, price economics, and demo scripts.

---

## ⚖️ Limitations & Ethical Stance
- **Price-only ranking**: We rank results purely by normalized price per unit. No sponsored or affiliate bias alters ranking order.
- **Public data only**: We access only public pharmacy pages.
- **No medical advice**: Clear, persistent safety notices are embedded across both the API and UI.
