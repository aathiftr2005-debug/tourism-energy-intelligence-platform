"""Tourism Energy Intelligence API — main application entry point.

AI-powered seasonal energy demand forecasting for European tourism regions.
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import assistant, etl, forecast, public, regions, stress_score
from app.core.auth import limiter
from app.core.config import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    logger.info(
        "Starting %s v%s [%s]",
        settings.app_name,
        settings.app_version,
        settings.environment,
    )

    try:
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("Background scheduler initialised")
    except Exception as e:
        logger.warning("Scheduler failed to start (non-blocking): %s", e)

    yield

    logger.info("Shutting down %s", settings.app_name)
    try:
        from app.services.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="Tourism Energy Intelligence API",
    description=(
        "AI-powered seasonal energy demand forecasting for European tourism regions. "
        "Provides ensemble ML forecasts (XGBoost + Prophet), real-time stress scores, "
        "SHAP explainability, and multi-source ETL pipelines."
    ),
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
    contact={
        "name": "Tourism Energy Intelligence Team",
        "url": "https://tourism-energy-intelligence.vercel.app",
    },
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers and request tracking to every response."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = round((time.monotonic() - start) * 1000, 1)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    logger.info(
        "%s %s %d %sms [req=%s]",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )

    return response


app.include_router(forecast.router, prefix="/api/v1")
app.include_router(etl.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(stress_score.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(assistant.router, prefix="/api/v1")


@app.get("/health")
async def health():
    """Comprehensive health check: API availability + database connectivity."""
    health_status = {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {},
    }

    # Database connectivity check
    try:
        from app.core.database import get_supabase
        supabase = get_supabase()
        supabase.table("api_keys").select("id").limit(1).execute()
        health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["checks"]["database"] = f"error: {type(e).__name__}"

    # Gemini API key configured check
    health_status["checks"]["gemini_configured"] = bool(settings.gemini_api_key)

    status_code = 200 if health_status["status"] == "ok" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/")
async def root():
    """Redirect root to API docs."""
    return RedirectResponse(url="/docs")
