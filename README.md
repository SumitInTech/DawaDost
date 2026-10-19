# Dawa Dost (दवा दोस्त) 💊🤝

> "Medicine friend" — finding cheaper, equivalent versions of medicines with live pharmacy prices, verified active composition, and transparent unit pricing.

Built for **Kritical Hacks 2026** (IGDTUW, Delhi) — Track: **AI/ML, Student Category**.

---

## 🌟 What Dawa Dost Is

Dawa Dost is an intelligent medicine price comparison and bio-equivalence engine:
1. **Resolves** branded medicines to their active chemical salt(s), dosage/strength, and dosage form.
2. **Reads live pharmacy websites** via **TinyFish** (Tata 1mg, Apollo Pharmacy, Netmeds, Zeelab Pharmacy, PharmEasy, MedPlus Mart).
3. **Extracts structured listings** (brand, salts, strength, form, pack size, price, stock, delivery timeline) powered by Gemini 3.5 Flash.
4. **Matches strictly equivalent medicines** (identical chemical salts, metric strength normalization, identical dosage form).
5. **Calculates price per unit** (e.g. per tablet, capsule, or ml) to normalize disparate pack sizes.
6. **Ranks transparently** by price per unit and displays real-time savings versus the branded reference.

> ⚠️ **Important Safety Disclaimer**: Dawa Dost does not sell medicines, does not take payments, and **provides no medical advice**. Equivalence is based strictly on chemical composition, strength, and form. Always confirm with a qualified doctor or licensed pharmacist before switching medications.

---

## 💡 Our Differentiators

1. **Price per unit, not price per pack**: Deceptive pack size variations (10s vs 15s) are normalized to exact per-tablet or per-ml costs.
2. **Deterministic bio-equivalence matching**: Python enforces strict chemical identity. **The LLM never computes prices, savings, or equivalence matches.**
3. **Live web data via TinyFish**: Live pricing, stock availability, and 6-digit delivery pincode verification across top pharmacies.
4. **Measured match accuracy**: **100.0% accuracy** across 122 automated test assertions on a hand-verified dataset of 20 real Indian reference medicines.

---

## 🚀 How We Use TinyFish

TinyFish is the live web backbone of Dawa Dost. We use three TinyFish API surfaces:
- **Search API (`api.search.tinyfish.ai`)**: Geo-targeted search across Indian online pharmacies to discover active product listing URLs for the searched medicine and its active salt equivalents.
- **Fetch API (`api.fetch.tinyfish.ai`)**: High-speed, clean markdown extraction of static and dynamic medicine product pages without running heavyweight browser agents for standard pages.
- **Web Agent API (`agent.tinyfish.ai/v1/automation/run`)**: Multi-step AI browser automation with stealth anti-detection profiles and proxy support to navigate interactive pharmacy websites (e.g. entering pincodes, selecting pack sizes, bypassing bot challenges).

All TinyFish integration is centralized in [`backend/app/services/tinyfish_client.py`](backend/app/services/tinyfish_client.py).

---

## 🛠️ Unified Architecture

```
React UI (Vite)  ──>  FastAPI Backend  ──>  TinyFish (Search / Fetch / Agent)  ──>  Pharmacy Sites
                            │                                                              │
                            │<── Clean page markdown / Structured output ──────────────────┘
                            ▼
             Google Gemini 3.5 Flash Extraction (Raw text -> ExtractedListing)
                            ▼
             Deterministic Python Engine (Salt + Strength + Form) & Unit Price Math
                            ▼
             Ranked Results (+ Savings, Confidence, Fetched-at, Pincode ETA)  ──>  React UI
                            ▲
             SQLite Cache (Timestamped, TTL, USE_CACHE_ONLY demo fail-safe)
```

---

## 📊 Measured Accuracy & Benchmark Results

We benchmarked our deterministic equivalence rules and salt resolution on a hand-verified dataset of 20 real Indian medicines (`backend/tests/data/medicines.json`):
- **Total Test Assertions**: 122
- **Passed Assertions**: 122
- **Failed Assertions**: 0
- **Overall Match Accuracy**: **100.0%**
- **Negative Control Rejection**: 100% rejection of wrong dosage forms (e.g. tablet vs syrup) and mismatched strengths.

---

## 💻 How to Run Locally

### 1. Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- TinyFish API Key ([agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys))
- Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your keys in `.env`:
```env
# Frontend
VITE_API_BASE_URL=http://localhost:8000

# Backend
TINYFISH_API_KEY=your_tinyfish_key_here
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_key_here
```

### 3. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`

### 4. Start Frontend
In a new terminal:
```bash
npm install
npm run dev
```
- Frontend app: `http://localhost:5173`

### 5. Running Tests
```bash
cd backend
python -m pytest backend/tests
```

---

## 🛡️ Medical Boundaries & Safety Disclaimer

**Dawa Dost is strictly a price-comparison search utility, NOT:**
- An online pharmacy or medicine seller
- A prescription fulfillment service
- A medical diagnostic or treatment platform
- A medical advice provider

The application intentionally does **NOT** include cart, checkout, payments, or prescription uploads. Users are clearly instructed on every view to confirm the medicine, active salt, strength, dosage form, and suitability with their doctor or pharmacist before making any substitution.
