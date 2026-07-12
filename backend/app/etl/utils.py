"""Shared caching, retry, and logging utilities for ETL modules."""

import json
import logging
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Optional

import pandas as pd

logger = logging.getLogger(__name__)


def _find_project_root() -> Path:
    """Walk upward from this file until a directory containing
    ``requirements.txt`` is found — that is the project root.

    Works regardless of directory depth:
    - Locally: ``backend/app/etl/utils.py`` → ``backend/``
    - Docker  (WORKDIR /app, COPY . .): ``/app/app/etl/utils.py`` → ``/app/``
    """
    current = Path(__file__).resolve().parent
    for candidate in [current, *current.parents]:
        if (candidate / "requirements.txt").exists():
            return candidate
    # Last-resort fallback (should never be reached in practice)
    return Path(__file__).resolve().parents[2]


RAW_CACHE_ROOT = _find_project_root() / "ml" / "data" / "raw"

TARGET_COUNTRIES = ["DE", "FR", "ES", "IT", "AT", "GR", "PT", "NL", "BE", "CZ"]

COUNTRY_COORDS: dict[str, tuple[float, float]] = {
    "DE": (52.52, 13.41),
    "FR": (48.85, 2.35),
    "ES": (40.42, -3.70),
    "IT": (41.90, 12.49),
    "AT": (48.21, 16.37),
    "GR": (37.98, 23.73),
    "PT": (38.72, -9.14),
    "NL": (52.37, 4.90),
    "BE": (50.85, 4.35),
    "CZ": (50.08, 14.44),
}

AIRPORT_CODES: dict[str, str] = {
    "DE": "EDDB",
    "FR": "LFPG",
    "ES": "LEMD",
    "IT": "LIRF",
    "AT": "LOWW",
    "GR": "LGAV",
    "PT": "LPPT",
    "NL": "EHAM",
    "BE": "EBBR",
    "CZ": "LKPR",
}


def get_cache_path(source: str, country: str, year: int, month: Optional[int] = None) -> Path:
    """Return filesystem path for a cached API response."""
    cache_dir = RAW_CACHE_ROOT / source.lower()
    if month is not None:
        return cache_dir / f"{country}_{year}_{month:02d}.json"
    return cache_dir / f"{country}_{year}.json"


def cache_is_fresh(cache_path: Path, max_age_hours: int = 24) -> bool:
    """Check if a cached file exists and is younger than max_age_hours."""
    if not cache_path.exists():
        return False
    file_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
    return file_age < timedelta(hours=max_age_hours)


def write_cache(cache_path: Path, data: Any) -> None:
    """Write JSON data to cache, creating parent directories as needed."""
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_cache(cache_path: Path) -> Any:
    """Read JSON data from cache."""
    with open(cache_path, "r", encoding="utf-8") as f:
        return json.load(f)


def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
) -> Callable:
    """Decorator: retry a function with exponential backoff."""
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        last_exc = None
        for attempt in range(max_retries + 1):
            try:
                return func(*args, **kwargs)
            except exceptions as e:
                last_exc = e
                if attempt < max_retries:
                    delay = base_delay * (backoff_factor ** attempt)
                    logger.warning(
                        "Attempt %d/%d failed for %s: %s. Retrying in %.1fs...",
                        attempt + 1, max_retries + 1, func.__name__, e, delay,
                    )
                    time.sleep(delay)
        logger.error("All %d retries exhausted for %s", max_retries + 1, func.__name__)
        raise last_exc  # type: ignore
    return wrapper


async def retry_with_backoff_async(
    coro_factory: Callable[[], Any],
    max_retries: int = 3,
    base_delay: float = 1.0,
    backoff_factor: float = 2.0,
) -> Any:
    """Retry an async callable with exponential backoff."""
    import asyncio
    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            return await coro_factory()
        except Exception as e:
            last_exc = e
            if attempt < max_retries:
                delay = base_delay * (backoff_factor ** attempt)
                logger.warning(
                    "Attempt %d/%d failed. Retrying in %.1fs...",
                    attempt + 1, max_retries + 1, delay,
                )
                await asyncio.sleep(delay)
    logger.error("All %d retries exhausted", max_retries + 1)
    raise last_exc  # type: ignore


def log_dataframe_info(df: pd.DataFrame, label: str) -> None:
    """Log shape, columns, and null counts for a DataFrame."""
    logger.info("%s — shape: %s, columns: %s", label, df.shape, list(df.columns))
    nulls = df.isnull().sum()
    if nulls.any():
        logger.warning("%s — null counts:\n%s", label, nulls[nulls > 0])
