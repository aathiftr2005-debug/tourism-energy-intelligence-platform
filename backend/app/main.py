"""Tourism Energy Intelligence API — main application entry point.

AI-powered seasonal energy demand forecasting for European tourism regions.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import assistant, etl, forecast, public, regions, stress_score
from app.core.auth import limiter
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tourism Energy Intelligence API",
    description=(
        "AI-powered seasonal energy demand forecasting for European tourism regions. "
        "Provides ensemble ML forecasts (XGBoost + Prophet), real-time stress scores, "
        "SHAP explainability, and multi-source ETL pipelines."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Tourism Energy Intelligence Team",
        "url": "https://tourism-energy-intelligence.vercel.app",
    },
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router, prefix="/api/v1")
app.include_router(etl.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(stress_score.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(assistant.router, prefix="/api/v1")

EVENT_SOURCE_LOADED = False


@app.on_event("startup")
async def startup_event():
    """Initialise the background scheduler on application startup."""
    global EVENT_SOURCE_LOADED
    if EVENT_SOURCE_LOADED:
        return
    EVENT_SOURCE_LOADED = True

    try:
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("Background scheduler initialised")
    except Exception as e:
        logger.warning("Scheduler failed to start (non-blocking): %s", e)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": "Tourism Energy Intelligence",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/")
async def root():
    """Redirect root to API docs."""
    return RedirectResponse(url="/docs")
