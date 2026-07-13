"""Energy API routes — proxy to ENTSO-E for real-time load and generation data.

Endpoints
---------
  GET /api/energy?country=XX&type=load        — actual load (A65)
  GET /api/energy?country=XX&type=generation  — generation mix (A75)
"""

import logging
import os
import re
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Energy"])

ENTSOE_MAPPING: dict[str, str] = {
    "DE": "10Y1001A1001A83F",
    "FR": "10YFR-RTE------C",
    "ES": "10YES-REE------0",
    "IT": "10YIT-GRTN-----B",
    "AT": "10YAT-APG------L",
    "GR": "10YGR-HTSO-----Y",
    "PT": "10YPT-REN------W",
    "NL": "10YNL-LUIN-----0",
    "BE": "10YBE----------2",
    "CZ": "10YCZ-CEPS-----N",
    "GB": "10YGB----------A",
    "CH": "10YCH-SWISSGRIDZ",
    "SE": "10YSE-1--------K",
    "NO": "10YNO-0--------C",
    "DK": "10YDK-1--------W",
    "FI": "10YFI-1--------U",
    "IE": "10YIE-1001A00010",
    "PL": "10YPL-AREA-----S",
    "HU": "10YHU-MAVIR----U",
    "RO": "10YRO-TEL------P",
    "BG": "10YCA-BULGARIA-R",
    "HR": "10YHR-HEP------M",
}

ENTSOE_BASE_URL = "https://web-api.tp.entsoe.eu/api"

_POINT_RE = re.compile(
    r"<Point>\s*<position>(\d+)</position>\s*<quantity>([\d.]+)</quantity>\s*</Point>"
)


def _date_param(d: datetime) -> str:
    return d.strftime("%Y%m%d%H%M%S")


@router.get("/energy")
async def get_energy(
    country: str = Query(..., description="ISO-2 country code"),
    energy_type: str = Query("load", alias="type", description="load or generation"),
):
    """Proxy request to ENTSO-E Transparency Platform."""
    api_key = os.getenv("ENTSOE_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=501, detail="ENTSO-E API key not configured")

    domain = ENTSOE_MAPPING.get(country.upper())
    if not domain:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown country code: {country}",
        )

    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=1)
    doc_type = "A75" if energy_type == "generation" else "A65"

    url = (
        f"{ENTSOE_BASE_URL}"
        f"?securityToken={api_key}"
        f"&documentType={doc_type}"
        f"&processType=A16"
        f"&in_Domain={domain}"
        f"&out_Domain={domain}"
        f"&periodStart={_date_param(start)}"
        f"&periodEnd={_date_param(now)}"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers={"Accept": "application/xml"})
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="ENTSO-E request timeout")
    except httpx.RequestError as exc:
        logger.error("ENTSO-E request failed: %s", exc)
        raise HTTPException(status_code=502, detail="ENTSO-E upstream error")

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"ENTSO-E error: {response.status_code}",
        )

    xml = response.text
    points = [
        {"position": int(m.group(1)), "quantity": float(m.group(2))}
        for m in _POINT_RE.finditer(xml)
    ]

    return {"points": points, "country": country.upper(), "type": energy_type}
