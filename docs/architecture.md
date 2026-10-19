# Dawa Dost Architecture & Technical Design

## 1. Pipeline Overview

```mermaid
flowchart TD
    User([User Query: Brand / Salt]) --> API[FastAPI /api/search]
    API --> SaltResolver[Salt Resolver: Seed Table -> LLM Fallback]
    SaltResolver --> ParallelSources[Parallel Source Orchestrator]
    
    subgraph TinyFish Layer
        ParallelSources --> TF_Search[TinyFish Search API]
        ParallelSources --> TF_Fetch[TinyFish Fetch API]
        ParallelSources --> TF_Agent[TinyFish Agent API]
    end
    
    TF_Search --> Extraction[LLM Structured Extraction]
    TF_Fetch --> Extraction
    TF_Agent --> Extraction
    
    Extraction --> Normalizer[Pydantic Validation & Normalizer]
    Normalizer --> Matcher[Equivalence Matcher: Same Salt + Strength + Form]
    Matcher --> Pricing[Pricing Engine: Unit Price & Savings Math]
    Pricing --> Cache[(SQLite Timestamped Cache)]
    Pricing --> Response([Ranked JSON Response])
```

## 2. Hard Design Rules
1. **Deterministic Arithmetic**: The LLM NEVER computes unit price, savings, or matching decisions. All arithmetic is in Python (`pricing.py`, `matcher.py`).
2. **Freshness Tracking**: Every listing carries an ISO-8601 `fetched_at` timestamp.
3. **Failure Isolation**: Each source runs in parallel via `asyncio.gather(..., return_exceptions=True)`. Per-source statuses (`ok`, `failed`, `cached`, `blocked`) are reported in the response.
4. **Resilient Caching**: Cached runs can be served transparently, and `USE_CACHE_ONLY=true` serves as a demo fail-safe.
