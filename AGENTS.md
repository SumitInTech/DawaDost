# Dawa Dost: project context for AI coding agents

Read this whole file before writing or changing any code. It is the single source of truth for what we are building, why, how it is structured, who owns what, and what we must not do. If something here conflicts with what a teammate tells you in the current session, follow the teammate and flag the conflict. If something is marked UNVERIFIED or OPEN, do not treat it as fact: verify it or ask.

---

## 1. What this project is

**Dawa Dost** ("medicine friend") is a web app that helps people find cheaper, equivalent versions of a medicine.

A user searches for a branded medicine. The system:
1. Resolves the brand to its active salt(s), strength and form.
2. Reads several pharmacy websites **live** through TinyFish.
3. Extracts structured listings (name, salt, strength, form, pack size, price, stock).
4. Matches only listings with the **same salt, same strength and same form**.
5. Computes **price per unit** (for example, per tablet) so different pack sizes are comparable.
6. Shows a ranked list with savings versus the searched brand, live stock, and a "fetched at" timestamp.

**What it is not:** it is not a pharmacy, does not sell or ship anything, does not take payments, and gives **no medical advice**. It never tells a user to switch medicines. Every result carries a visible "confirm with your pharmacist or doctor" message.

### Why this exists (problem statement)
The same medicine (same salt, same strength) is sold under different brand names at very different prices, and prices and stock differ across pharmacies. Most people never compare, so they overpay. Existing comparison tools are mostly price-per-pack and often stale.

### Our differentiators (keep these central, they decide the innovation score)
1. **Price per unit, not price per pack** (normalise pack sizes).
2. **Brand to generic-equivalent matching** by salt + strength + form.
3. **Live data via TinyFish** with a visible fetched-at time, plus in-stock and optional pincode availability.
4. **Measured match accuracy** on a hand-verified test set of about 20 medicines, reported in the README and PPT.

---

## 2. Hackathon constraints (these are hard requirements)

Event: **Kritical Hacks 2026** (IGDTUW, Delhi). Track: **AI/ML, student category**. Team size 2 to 5.

**Online round deadline: Tuesday 20 Oct 2026, 11:59 PM IST**, submitted via Unstop. Finale (shortlisted teams only): 31 Oct to 1 Nov 2026, offline.

Submission checklist:
- Public GitHub repo with working code, a clear README (what it is, how to run, **how TinyFish is used**) and visible commits.
- Demo video showing the project working, including the TinyFish integration.
- Public social media post (LinkedIn or X) with a demo clip or screenshots and the repo link.
- PPT, **max 8 slides**.

**TinyFish is mandatory and must be real.** A token mention scores poorly and can disqualify. The integration must be functional and relevant, and the team must be able to explain and demonstrate it.

Scoring rubric (100 points). Every engineering decision should help one of these:

| Criteria | Pts | What helps |
|---|---|---|
| Working GitHub project | 20 | Public repo, runnable code, clear README, many small commits |
| TinyFish integration | 20 | Search + Fetch + Agent used meaningfully in the core pipeline |
| Innovation and idea | 20 | The four differentiators above |
| Technique | 10 | Clean architecture, code (not LLM) does matching and math, tests, accuracy report |
| Impact and usefulness | 10 | Real searches with real savings shown |
| Revenue model | 10 | Measured cost per search, sourced market numbers, justified prices |
| Social media post | 10 | Public post with demo and repo link |

---

## 3. Team and ownership

| Person | Owns |
|---|---|
| DRIFT and Arjun | FastAPI backend, TinyFish integration (split between them, see 11) |
| Vishesh and Vaibhav | React frontend |
| Sumit | PPT (max 8 slides) |

Unassigned items are tracked in `dawa_dost_task_tracker.xlsx`: README and repo hygiene, test set, demo video, social post, price economics research, API contract, feasibility test, safety wording, end-to-end testing and fallback, final submission.

When you work in a role's area, stay inside it. If a change needs another role's area (for example, a new field in the API response), update the contract in section 8 first and say so clearly.

---

## 4. Architecture

```
React UI  ->  FastAPI backend  ->  TinyFish (Search / Fetch / Agent)  ->  pharmacy sites
                  |                                                        |
                  |<---- raw page content / structured output <------------|
                  v
          LLM extraction (raw text -> structured fields)
                  v
          Python matcher (salt + strength + form) and unit price math
                  v
          Ranked results (+ savings, confidence, fetched_at)  ->  UI
                  ^
          SQLite cache (timestamped; also the demo fallback)
```

### Hard design rules
1. **The LLM never computes a price, a unit price, a saving, or a match decision.** It only turns messy text into fields and optionally phrases explanations. All numbers and match decisions come from plain Python so they cannot be hallucinated.
2. **Every result carries `fetched_at`.** Prices change; never show data without its age.
3. **Every listing carries a `match_confidence`.** Low-confidence matches are flagged in the UI, not silently shown or silently dropped.
4. **Sources are config-driven** (`backend/sources.yaml`), not hard-coded, so we can drop a site that blocks us without code changes.
5. **Sources run in parallel** (`asyncio`) and failures are isolated: one failing site must not fail the whole search. Return a per-source status.
6. **Cache everything** with a timestamp. It saves TinyFish credits and gives us a demo fallback if Wi-Fi or a site fails.
7. **Secrets never get committed.** Keys live in `.env`; the repo ships `.env.example`.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Models and validation | Pydantic |
| Web data | TinyFish: Search, Fetch, Agent (Browser only if needed) |
| LLM | Behind an abstraction in `services/llm.py`. Provider is OPEN (see 14). Used for extraction and salt resolution only |
| Matching | Plain Python plus `rapidfuzz` for fuzzy name matching |
| Concurrency | `asyncio`, `httpx` |
| Cache | SQLite (or JSON files if simpler) |
| Frontend | React with Vite (JS or TS: decide once, see 14) |
| Config | `.env`, `sources.yaml` |
| Tests | `pytest` for backend, including the medicine test set |
| Hosting | Local for the demo. A hosted link is a bonus, not a requirement |

---

## 6. TinyFish: what we know and what to verify

TinyFish provides infrastructure for AI apps to use the live web. It has four public API surfaces under one API key:

| API | Purpose | Cost note |
|---|---|---|
| Search | Structured, ranked web results for a query | Free per TinyFish docs |
| Fetch | Renders a URL in a real browser and returns clean content (Markdown, HTML or JSON) | Free per TinyFish docs |
| Agent | Goal-driven multi-step actions on sites from a natural-language goal; returns structured JSON | Uses credits |
| Browser | Remote browser session controlled via Playwright or CDP | Uses credits |

Endpoints listed in TinyFish's public docs:
- Agent: `https://agent.tinyfish.ai/v1/automation/...` with `/run`, `/run-async`, `/run-sse` variants
- Search: `GET https://api.search.tinyfish.ai`
- Fetch: `POST https://api.fetch.tinyfish.ai`
- Browser: `POST https://api.browser.tinyfish.ai`

Auth: header `X-API-Key: $TINYFISH_API_KEY`. SDKs: Python `pip install tinyfish` (`from tinyfish import TinyFish`), JavaScript `@tiny-fish/sdk`. Agent profiles include lite and stealth browser modes, and proxy routing by country is supported. The $13 free credits come from the organisers' sign-up link.

**UNVERIFIED, check before coding:** exact request and response field names, rate limits, parameter names for stealth profile and proxy, and how captchas are handled. The docs index is at `https://docs.tinyfish.ai/llms.txt` and the full docs at `https://docs.tinyfish.ai/`. **Fetch those first and code against the real schema.** Save real raw responses into `samples/` and build tests from them.

### How we use TinyFish (this is what the README and demo must show)
- **Search**: given the resolved salt/brand, find product pages on each configured pharmacy.
- **Fetch**: pull clean content from product pages that render without interaction.
- **Agent**: handle sites that need interaction (for example entering a pincode for availability, picking a pack size or variant) and return structured fields.
- Run per-source calls **in parallel**. Have the Agent do structured extraction where possible rather than fetching a page and dumping it.
- Keep TinyFish usage in one module (`services/tinyfish_client.py`) so the integration is easy to point at in the demo and README.

Credit discipline: Search and Fetch first; use Agent only when needed; cache results; add a `USE_CACHE_ONLY=true` mode for development and demo fallback.

---

## 7. Repository structure (create this)

```
dawa-dost/
  AGENTS.md                  (this file; copy as GEMINI.md if your tool expects that name)
  README.md                  (problem, screenshot, how to run, "How we use TinyFish", limitations)
  .env.example
  .gitignore                 (must ignore .env, node_modules, __pycache__, *.db)
  backend/
    requirements.txt
    sources.yaml             (list of pharmacy sources: name, base_url, strategy: fetch|agent, enabled)
    app/
      main.py                (FastAPI app, CORS, router include)
      config.py              (env loading)
      api/routes.py          (endpoints in section 8)
      models/schemas.py      (Pydantic models in section 9)
      services/
        tinyfish_client.py   (all TinyFish calls live here)
        sources.py           (loads sources.yaml, orchestrates parallel per-source fetch)
        extraction.py        (LLM: raw text -> ExtractedListing)
        salt_resolver.py     (brand -> salt/strength/form; local table first, LLM fallback)
        matcher.py           (equivalence rules and confidence)
        pricing.py           (unit price and savings math)
        cache.py             (SQLite, timestamps, TTL)
        llm.py               (provider abstraction)
    tests/
      data/medicines.json    (20 hand-verified medicines: see section 12)
      test_matcher.py
      test_pricing.py
      test_extraction_samples.py
  frontend/                  (Vite + React)
    src/
      api/client.js          (the only place that calls the backend)
      components/            (SearchBar, ResultsTable, SavingsBanner, SourceStatus, SafetyBanner, ConfidenceBadge)
      pages/                 (Home)
  samples/                   (real raw TinyFish outputs, for tests and the README)
  docs/
    architecture.md
    price-economics.md       (inputs for the PPT: measured costs, sourced numbers)
    demo-script.md
```

Run locally:
- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm install && npm run dev` (Vite default port 5173)
- CORS: backend must allow the frontend origin from `ALLOWED_ORIGINS`.

Environment variables (`.env.example` lists all of these with empty values):
`TINYFISH_API_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `CACHE_DB_PATH`, `CACHE_TTL_MINUTES`, `ALLOWED_ORIGINS`, `USE_CACHE_ONLY`.

---

## 8. API contract (PROPOSED, agree and freeze early so frontend is not blocked)

Any change to this section must be announced to the frontend owners.

### `GET /api/health`
Returns `{ "status": "ok" }`.

### `POST /api/search`
Request:
```json
{ "query": "string (brand or salt name)", "pincode": "string, optional" }
```
Response `200`:
```json
{
  "query": "string",
  "resolved": { "brand": "string|null", "salts": ["string"], "strength": "500 mg", "form": "tablet" },
  "reference_listing": { "...Listing or null": "the searched brand's own best listing, used as the savings baseline" },
  "results": [ "Listing, sorted by price_per_unit_inr ascending" ],
  "savings": { "vs_reference_inr_per_unit": 0.0, "vs_reference_percent": 0.0 },
  "sources": [ { "name": "string", "status": "ok|failed|cached|blocked", "fetched_at": "ISO-8601", "message": "string|null" } ],
  "warnings": ["string"],
  "disclaimer": "Prices are indicative. Confirm the medicine, strength and availability with your pharmacist or doctor before buying."
}
```
Errors: `400` for an empty or invalid query; `200` with an empty `results` and `warnings` when nothing matched; never a `500` because one source failed.

Optional stretch: `GET /api/search/stream` (Server-Sent Events) to show per-source progress.

---

## 9. Data schemas (Pydantic, in `models/schemas.py`)

`Listing`:
- `source`: str (pharmacy name)
- `product_name`: str
- `brand`: str | None
- `salts`: list[str] (normalised, lowercase)
- `strength`: str (normalised, for example "500 mg")
- `form`: str (tablet, capsule, syrup, ...)
- `pack_size_units`: float | None (tablets in the pack, or ml)
- `price_inr`: float
- `price_per_unit_inr`: float | None (computed in `pricing.py`, never by the LLM)
- `in_stock`: bool | None (None means unknown)
- `url`: str
- `fetched_at`: datetime (UTC)
- `cached`: bool
- `is_reference_brand`: bool
- `match_confidence`: float (0 to 1)
- `flags`: list[str] (for example "low_confidence", "pack_size_unclear")

`ExtractedListing` is the LLM output shape (same fields minus computed ones). Validate it strictly; reject and flag anything that fails validation instead of guessing.

---

## 10. Core logic rules

### Equivalence (matcher.py)
Two listings are equivalent only if **all** hold:
- The **set of salts** is identical (combination products must match exactly, not partially).
- **Strength** is identical after normalisation (value and unit, for example "500 mg" equals "0.5 g"; do not equate mg and mcg without conversion).
- **Form** is identical (tablet is not capsule; do not compare solids with liquids).

Fuzzy name matching (`rapidfuzz`) is only for identifying the same product string across sites. It never overrides the salt, strength and form rules.

### Unit price (pricing.py)
- Solid forms: `price_per_unit = price_inr / pack_size_units` (per tablet or capsule).
- Liquids: per ml.
- If `pack_size_units` is missing or ambiguous: leave `price_per_unit_inr` as `None`, add flag `pack_size_unclear`, and do not rank it as if it were comparable.

### Confidence
Compute `match_confidence` from rule agreement plus extraction completeness (for example, missing strength lowers it). Threshold is configurable (start at 0.8 and tune on the test set). Below the threshold, show the listing with a visible low-confidence badge.

### Salt resolution (salt_resolver.py)
1. Look up the brand in a small local table (the verified test set seeds it).
2. If missing, use the LLM, mark the result as `resolved_by: llm`, and lower the confidence.
3. If still unresolved, return an empty result with a clear warning. Never guess.

---

## 11. Work breakdown by role

### Backend and TinyFish (DRIFT and Arjun)
Suggested split (confirm between yourselves): one person owns `tinyfish_client.py`, `sources.py`, `cache.py`, feasibility testing and the repo/README; the other owns `extraction.py`, `salt_resolver.py`, `matcher.py`, `pricing.py` and the test set.

Done when:
- Feasibility test completed: one real TinyFish call per candidate pharmacy, raw outputs saved in `samples/`, and 3 working sources chosen and enabled in `sources.yaml`.
- `POST /api/search` returns real data end to end for at least 5 medicines.
- Per-source failures are isolated and reported in `sources`.
- Cache works, and `USE_CACHE_ONLY=true` serves a saved run.
- Test set accuracy is measured and written to the README.
- Measured TinyFish credit cost per search is recorded in `docs/price-economics.md` (Sumit needs this).

### Frontend (Vishesh and Vaibhav)
Build against the contract in section 8; use a mock server or fixture JSON until the backend is live.
- Search bar (query plus optional pincode), loading state with per-source progress, empty state, error state.
- Results table sorted by price per unit, with: pharmacy, product, pack size, price, price per unit, stock badge, fetched-at time, confidence badge, link out to the pharmacy page.
- Savings banner versus the searched brand's reference listing.
- Source status chips (ok, cached, blocked, failed).
- **Persistent safety banner** with the disclaimer text from the API. It must always be visible on the results view.
- Responsive layout, readable on a projector for the demo.
- All backend calls go through `src/api/client.js`.

### PPT (Sumit)
Max 8 slides, flow: Problem, Solution, Tech stack (show TinyFish clearly), Price economics, Revenue model, Future scope, plus up to two for architecture/demo and our differentiators. Needs from the team: architecture diagram, demo screenshots, measured cost per search, accuracy number, real example with real savings.

---

## 12. Test set (20 medicines)

`backend/tests/data/medicines.json`: 20 entries, each hand-verified against packaging or an official source by **two** people:
```json
{ "brand": "string", "salts": ["string"], "strength": "string", "form": "string", "known_equivalents": ["string"] }
```
Use it to (a) seed salt resolution and (b) compute and report match accuracy. Do not generate this data with an LLM and ship it unverified. Pick common, low-risk medicines, and avoid anything where a wrong match could be dangerous in a demo.

---

## 13. Safety, ethics and legal rules (non-negotiable)

- No medical advice, no dosage guidance, no "you should switch". Show equivalents by salt, strength and form only, with the disclaimer.
- **Rank by price only.** If we ever add affiliate links, commission must never affect order. State this in the README.
- Public pages only. No logins, no accounts, no purchases, no payments. Respect each site's terms and robots rules; if a site forbids automated access or blocks us, drop it from `sources.yaml` instead of working around it.
- Never log or store personal data. A pincode is used only for the request and is not persisted.
- Be honest in the README and demo about limits: data can be stale, sites change, matching can be wrong, and results are indicative.

---

## 14. Open decisions (do not assume; ask the team)

1. **Which 3 pharmacy sources**: decided only after the feasibility test.
2. **LLM provider and model** for extraction and salt resolution.
3. **React in JS or TypeScript.**
4. **Hosting**: local only, or a free tier for a shareable link.
5. **Revenue model details**: affiliate commission and a B2B price-data API are the candidates. Whether pharmacies actually run affiliate programs, and their terms, are UNVERIFIED. Research real terms and cite sources; do not invent figures.
6. **API contract** (section 8) is a proposal until frontend and backend sign off.

---

## 15. Revenue and price economics (inputs for the PPT and `docs/price-economics.md`)

Candidate model: free for consumers; revenue from referral or affiliate commission on click-through orders, and a B2B price-data API for clinics, NGOs and health-tech apps. Weak points to be honest about: thin margins on generics, possible lack of affiliate programs, and the conflict-of-interest question (answered by price-only ranking).

The economics slide needs, in this order:
1. **Cost per search**: measured from real runs (TinyFish credits for Agent/Browser calls, plus LLM cost). Search and Fetch are free per TinyFish docs.
2. **Revenue per converted click-through**: from real, cited affiliate terms.
3. **Break-even**: conversions needed to cover search cost.
4. **Market size**: from a cited source.
No number goes into a slide without a source or a measurement.

---

## 16. Timeline

- **Sun 18 Oct (tonight)**: create repo and first commit; sign up for TinyFish and claim credits; read TinyFish docs; one real Search and Fetch call saved to `samples/`; freeze API contract; start feasibility test on candidate pharmacies.
- **Mon 19 Oct**: matching and unit-price logic working end to end; frontend wired to the backend; test set and accuracy; README draft; record demo video with a cached fallback; Sumit drafts PPT.
- **Tue 20 Oct**: social post (public, with video and repo link); finalise PPT; check every link in an incognito window; **submit on Unstop well before 11:59 PM**.

---

## 17. Working rules for AI coding agents

1. Read this file first. Re-read the relevant section before touching an area.
2. Do not invent TinyFish API parameters or response fields. Read the docs (section 6) and use saved `samples/`.
3. Do not invent prices, medicine data, market figures or accuracy numbers.
4. Keep the LLM out of arithmetic and match decisions (section 4, rule 1).
5. Keep TinyFish calls inside `tinyfish_client.py`.
6. Make small, frequent commits with clear messages (the repo's commit history is scored). Never commit `.env` or API keys.
7. Write or update a test with each logic change (matcher, pricing, extraction samples).
8. Prefer simple, readable code over clever code; this must be explainable to judges.
9. Never make a change that weakens a safety rule in section 13.
10. If a requirement is ambiguous or an OPEN decision blocks you, stop and ask instead of guessing.
11. When you finish a task, state what changed, what you verified, and what is still unverified.

## 18. Definition of done (for submission)

- [ ] Public repo with runnable code, `.env.example`, clear README, visible commit history
- [ ] README has "How we use TinyFish" with code locations, plus limitations
- [ ] 3 pharmacy sources working, with a cached fallback
- [ ] Per-unit prices, savings and confidence shown correctly for at least 5 real medicines
- [ ] Safety disclaimer visible in the UI
- [ ] Accuracy on the 20-medicine test set measured and reported
- [ ] Demo video recorded (shows the TinyFish integration working)
- [ ] Public social post live, with video and repo link
- [ ] PPT (max 8 slides) with sourced price economics
- [ ] Submitted on Unstop before the deadline, links checked in an incognito window
