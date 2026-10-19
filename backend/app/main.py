"""FastAPI Application Entrypoint for Dawa Dost.

Configures CORS, middleware, lifecycle events, and API routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings

app = FastAPI(
    title="Dawa Dost API",
    description="Medicine Price Comparison & Bio-Equivalence Engine for Indian Pharmacies",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "Dawa Dost API",
        "status": "online",
        "docs": "/docs",
    }
