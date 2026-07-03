"""API key authentication, rate limiting, and key management.

Provides:
  - generate_api_key()       — create secure key, store SHA256 hash in Supabase
  - verify_api_key()         — hash + lookup against stored hashes
  - require_api_key()        — FastAPI dependency for protected routes
  - Rate limiting via slowapi
"""

import hashlib
import hmac
import logging
import secrets
from datetime import datetime
from typing import Optional

from fastapi import Header, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_supabase

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


def _hash_key(key: str) -> str:
    """Return the SHA-256 hex digest of an API key.

    Uses a constant-time comparison compatible format.
    """
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def generate_api_key(name: str, email: str) -> Optional[str]:
    """Generate a new API key, store its SHA-256 hash in Supabase.

    Parameters
    ----------
    name : str   human-readable label for the key
    email : str  recipient email for delivery

    Returns
    -------
    str | None  the plain-text API key (shown once) or None on failure
    """
    raw_key = "TEI-" + secrets.token_urlsafe(32)
    key_hash = _hash_key(raw_key)

    try:
        supabase = get_supabase()
        supabase.table("api_keys").insert({
            "key_hash": key_hash,
            "name": name,
            "email": email,
            "is_active": True,
            "request_count": 0,
        }).execute()
        logger.info("API key created for %s <%s>", name, email)
        return raw_key
    except Exception as e:
        logger.error("Failed to store API key: %s", e)
        return None


def verify_api_key(key: str) -> bool:
    """Verify an API key against stored hashes in Supabase.

    Updates last_used timestamp and increments request_count on success.
    """
    key_hash = _hash_key(key)

    try:
        supabase = get_supabase()
        response = (
            supabase.table("api_keys")
            .select("*")
            .eq("key_hash", key_hash)
            .eq("is_active", True)
            .maybe_single()
            .execute()
        )

        record = response.data if response else None
        if not record:
            logger.warning("API key verification failed: hash not found")
            return False

        supabase.table("api_keys").update({
            "last_used": datetime.utcnow().isoformat(),
            "request_count": (record.get("request_count", 0) or 0) + 1,
        }).eq("id", record["id"]).execute()

        return True
    except Exception as e:
        logger.error("API key verification error: %s", e)
        return False


async def require_api_key(x_api_key: str = Header(...)) -> str:
    """FastAPI dependency: validate the X-API-Key header.

    Raises 401 if the key is missing, invalid, or inactive.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key. Obtain a valid key at /api/public/keys/register.",
        )

    return x_api_key
