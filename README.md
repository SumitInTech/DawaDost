# Dawa Dost — Medicine Price Comparison Platform

> **"Same medicine. Smarter savings."**  
> *Compare medicine prices. Understand the difference.*

Dawa Dost is a modern, responsive, healthcare-tech platform developed for a hackathon. It helps consumers compare prices of branded medicines with equivalent pharmaceutical listings matching the **same active chemical salt, strength, and dosage form** across verified Indian retail and online pharmacies (including Tata 1mg, Apollo Pharmacy, PharmEasy, Netmeds, and Truemeds).

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Strict Tech Stack

This frontend strictly follows hackathon specifications:
- **Framework**: React 19 + Vite
- **Language**: JavaScript (ES Modules, `.jsx` for React components, `.js` for utilities)
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: Lucide React (`lucide-react`)
- **Styling**: Pure CSS (Custom CSS Variables, BEM-inspired naming, responsive grid & flexbox layouts)
- **API Communication**: Native Fetch API with graceful fallback to realistic clinical mock datasets
- *No TypeScript, No Next.js, No Tailwind CSS, No external heavyweight component libraries.*

---

## 📱 Three Core Application Pages

1. **Home / Search Page (`/`)**:
   - **Hero Section**: Two-column layout with value proposition, prominent medicine search form (medicine name + optional 6-digit pincode), and illustrative product preview card.
   - **Trust Strip**: 3 core capabilities (Compare cost per unit, Pharmacy price discovery, Transparent comparisons).
   - **How It Works Preview**: 3-step process overview with direct link to the guide.
   - **Why Price Per Unit Matters**: Side-by-side comparison of Pack A (10 tablets @ ₹80 = ₹8/tab) vs Pack B (20 tablets @ ₹120 = ₹6/tab).
   - **Safety & Transparency Block**: Medical boundaries disclaimer and guidance.
   - **Final Call to Action**: Quick jump to search.

2. **Medicine Search Results Page (`/search`)**:
   - **Page Header & Breadcrumbs**: Breadcrumb trail and searched medicine clinical summary card (displaying active salt, strength, dosage form).
   - **Dedicated Results Search Bar**: Allows executing new searches directly without returning to the homepage, preserving pincode.
   - **Savings Summary Banner**: Highlights unit price savings (e.g., *"Save up to ₹10.55 per unit"*), percentage discount, and normalized strip comparison.
   - **Pharmacy Source Status Strip**: Live monitors for indexed pharmacies (`ok`, `cached`, `failed`, `blocked`) with timestamps.
   - **Filter & Sorting Toolbar**: Dynamic count of matching results, expandable filter toggle, and sort controls.
   - **Responsive Product Card GRID**: 3 columns (Desktop), 2 columns (Tablet), 1 column (Mobile).
   - **Interactive Product Cards**:
     - Unit price highlighted as the primary metric (e.g. ₹11.80 / tablet).
     - Full pack price and quantity.
     - Potential unit savings badge vs reference brand.
     - Match confidence badge (*High Confidence*, *Review Details*, *Low Confidence*).
     - Availability badge (*In Stock*, *Out of Stock*, *Stock Unknown*).
     - Data freshness timestamp (*Retrieved 3 min ago*, *Cached result*).
     - External link: *"View at pharmacy ↗"* (opens in new tab, never an in-app checkout).
     - Expandable details panel: reveals active salt, strength, standard packaging, batch details, and pharmacy clinical notes.
   - **Full Functional Client-side Filters**:
     - Stock availability (In stock, Out of stock, Stock unknown).
     - Unit price range (Min / Max ₹ per unit).
     - Pharmacy sources (Dynamically generated from current response).
     - Match confidence thresholds.
     - Geolocation distance filter (enabled when distance data is available).
   - **Sorting Modes**:
     - Lowest price per unit (Default comparison standard).
     - Highest price per unit.
     - Lowest pack price.
     - Highest pack price.
     - Nearest pharmacy (disabled with clear notice if distance data is unavailable).
   - **States**: Loading skeletons, Empty state with search suggestions, and resilient Error state with retry action.
   - **Persistent Safety Banner**: Mandatory clinical disclaimer visible throughout results viewing.

3. **How It Works Page (`/how-it-works`)**:
   - Visual flow: Search → Find listings → Check details → Compare prices.
   - Four detailed process cards explaining data ingestion and matching.
   - Scientific criteria for medicine bioequivalence (Same active salt, same strength, same dosage form).
   - Clear mathematical explanation on why pack prices alone mislead consumers.
   - Data transparency details (timestamps, cache status, downtime handling).
   - Clinical safety and medical consultation advisory.

---

## 🔌 FastAPI / Backend API Integration

The frontend is fully prepared to communicate with the Python / FastAPI / TinyFish backend.

### Configuration
Create a `.env` file from `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Proposed Endpoint
`POST /api/search`

#### Request Body
```json
{
  "query": "Augmentin 625 Duo",
  "pincode": "110001"
}
```

#### Response Structure
```json
{
  "query": "Augmentin 625 Duo",
  "pincode": "110001",
  "resolved": {
    "product_name": "Augmentin 625 Duo Tablet",
    "brand": "GlaxoSmithKline Pharmaceuticals Ltd",
    "salts": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    "strength": "625 mg",
    "form": "Tablet",
    "pack_size_units": 10,
    "reference_price_inr": 223.50,
    "reference_unit_price_inr": 22.35
  },
  "reference_listing": {
    "source": "Tata 1mg",
    "product_name": "Augmentin 625 Duo Tablet",
    "brand": "GlaxoSmithKline Pharmaceuticals Ltd",
    "salts": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    "strength": "625 mg",
    "form": "Tablet",
    "pack_size_units": 10,
    "price_inr": 223.50,
    "price_per_unit_inr": 22.35,
    "in_stock": true,
    "url": "https://www.1mg.com/drugs/augmentin-625-duo-tablet-138629",
    "fetched_at": "2026-10-19T18:25:00Z",
    "cached": false,
    "is_reference_brand": true,
    "match_confidence": "high",
    "flags": ["Reference brand queried", "Exact salt & dosage match"]
  },
  "savings": {
    "reference_brand_price_inr": 223.50,
    "reference_unit_price_inr": 22.35,
    "lowest_pack_price_inr": 118.00,
    "lowest_unit_price_inr": 11.80,
    "potential_unit_savings_inr": 10.55,
    "percentage_unit_savings": 47.2,
    "potential_pack_savings_inr": 105.50,
    "pack_savings_note": "Savings comparison calculated for standard 10-tablet strip equivalent"
  },
  "sources": [
    { "name": "Tata 1mg", "status": "ok", "fetched_at": "2026-10-19T18:32:00Z", "results_count": 3 },
    { "name": "Apollo Pharmacy", "status": "ok", "fetched_at": "2026-10-19T18:31:40Z", "results_count": 2 },
    { "name": "PharmEasy", "status": "cached", "fetched_at": "2026-10-19T17:45:00Z", "results_count": 2 }
  ],
  "results": [
    {
      "id": "res-aug-1",
      "source": "Truemeds",
      "product_name": "Novamox CV 625 Tablet",
      "brand": "Cipla Ltd",
      "salts": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
      "strength": "625 mg",
      "form": "Tablet",
      "pack_size_units": 10,
      "price_inr": 118.00,
      "price_per_unit_inr": 11.80,
      "in_stock": true,
      "distance_km": 1.8,
      "url": "https://www.truemeds.com",
      "fetched_at": "2026-10-19T16:30:00Z",
      "cached": true,
      "is_reference_brand": false,
      "match_confidence": "high",
      "savings_vs_ref_unit": 10.55,
      "flags": ["Identical active salt ratio", "Standard 10-strip pack"]
    }
  ],
  "warnings": [
    "Prices retrieved within the last 2 hours. Stock status subject to real-time pharmacy confirmation."
  ],
  "disclaimer": "Dawa Dost provides price comparisons, not medical advice. Confirm active salt, strength, and dosage form with your doctor or pharmacist."
}
```

### Automatic Resilience & Fallback
If the backend is not running or unreachable during a demo or judging, `src/api/client.js` automatically catches connection errors and falls back to verified clinical mock datasets in `src/data/mockResults.js`.

---

## 🛡️ Medical Boundaries & Safety Disclaimer

**Dawa Dost is strictly a price-comparison search utility, NOT:**
- An online pharmacy or medicine seller
- A prescription fulfillment service
- A medical diagnostic or treatment platform
- A medical advice provider

The application intentionally does **NOT** include cart, checkout, payments, or prescription uploads. Users are clearly instructed on every view to confirm the medicine, active salt, strength, dosage form, and suitability with their doctor or pharmacist before making any substitution.
#   D a w a D o s t  
 