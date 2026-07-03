"""Email alert system using SendGrid for critical and elevated stress scores.

Sends dark-themed HTML email alerts with traffic-light indicators,
top contributing factors, and actionable recommendations.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from app.core.config import settings
from app.core.database import get_supabase
from app.etl.utils import TARGET_COUNTRIES
from app.ml.stress_score import calculate_stress_score

logger = logging.getLogger(__name__)

COUNTRY_META: dict[str, dict[str, str]] = {
    "DE": {"name": "Germany", "flag": "\U0001f1e9\U0001f1ea"},
    "FR": {"name": "France", "flag": "\U0001f1eb\U0001f1f7"},
    "ES": {"name": "Spain", "flag": "\U0001f1ea\U0001f1f8"},
    "IT": {"name": "Italy", "flag": "\U0001f1ee\U0001f1f9"},
    "AT": {"name": "Austria", "flag": "\U0001f1e6\U0001f1f9"},
    "GR": {"name": "Greece", "flag": "\U0001f1ec\U0001f1f7"},
    "PT": {"name": "Portugal", "flag": "\U0001f1f5\U0001f1f9"},
    "NL": {"name": "Netherlands", "flag": "\U0001f1f3\U0001f1f1"},
    "BE": {"name": "Belgium", "flag": "\U0001f1e7\U0001f1ea"},
    "CZ": {"name": "Czech Republic", "flag": "\U0001f1e8\U0001f1ff"},
}

TRAFFIC_LIGHT_COLORS: dict[str, str] = {
    "CRITICAL": "#ff4444",
    "ELEVATED": "#ffaa00",
    "NORMAL": "#00c853",
}


def format_alert_email(stress_data: dict) -> str:
    """Build a dark-themed HTML email for a stress alert.

    Parameters
    ----------
    stress_data : dict  — must contain country_code, stress_score, stress_level,
                         traffic_light, contributing_factors, recommendation,
                         year, month

    Returns
    -------
    str — complete HTML email body
    """
    country_code = stress_data.get("country_code", "XX")
    meta = COUNTRY_META.get(country_code, {"name": country_code, "flag": ""})
    stress_level = stress_data.get("stress_level", "NORMAL")
    score = stress_data.get("stress_score", 0)
    color = TRAFFIC_LIGHT_COLORS.get(stress_level, "#888888")
    traffic_light = stress_data.get("traffic_light", "\U0001f7e2")
    recommendation = stress_data.get("recommendation", "")
    factors = stress_data.get("contributing_factors", {})
    year = stress_data.get("year", datetime.now().year)
    month = stress_data.get("month", datetime.now().month)

    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    month_name = month_names[month - 1] if 1 <= month <= 12 else str(month)

    factors_rows = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;'>{k}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:center;'>{'🟢' if float(v) < 0.5 else '🔴'}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:right;font-family:monospace;'>{v}</td></tr>"
        for k, v in (factors or {}).items()
    )

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
<tr><td style="padding:32px 32px 0 32px;text-align:center;">
<span style="font-size:48px;">{meta['flag']}</span>
<h1 style="color:#ffffff;font-size:28px;margin:12px 0 4px 0;">{meta['name']}</h1>
<p style="color:#888888;font-size:14px;margin:0 0 20px 0;">{month_name} {year} — Energy Stress Alert</p>
<div style="background-color:{color};border-radius:12px;padding:20px;margin:16px 0;">
<span style="font-size:48px;">{traffic_light}</span>
<div style="font-size:56px;font-weight:800;color:#ffffff;letter-spacing:-2px;margin:8px 0;">{score:.1f}</div>
<div style="font-size:18px;font-weight:600;color:#ffffff;">{stress_level}</div>
</div>
</td></tr>
<tr><td style="padding:24px 32px;">
<h3 style="color:#00d4ff;font-size:16px;margin:0 0 12px 0;">Top Contributing Factors</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<thead>
<tr style="background-color:#2a2a4a;">
<th style="padding:8px 12px;color:#aaaaaa;font-size:12px;text-transform:uppercase;text-align:left;">Factor</th>
<th style="padding:8px 12px;color:#aaaaaa;font-size:12px;text-transform:uppercase;text-align:center;">Impact</th>
<th style="padding:8px 12px;color:#aaaaaa;font-size:12px;text-transform:uppercase;text-align:right;">Value</th>
</tr>
</thead>
<tbody style="color:#ffffff;font-size:14px;">
{factors_rows}
</tbody>
</table>
</td></tr>
<tr><td style="padding:0 32px 24px 32px;">
<h3 style="color:#00d4ff;font-size:16px;margin:0 0 8px 0;">Recommendation</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0;">{recommendation}</p>
</td></tr>
<tr><td style="padding:0 32px 32px 32px;text-align:center;">
<a href="https://tourism-energy-intelligence.vercel.app/dashboard" style="display:inline-block;background-color:#00d4ff;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;">View Dashboard</a>
</td></tr>
<tr><td style="padding:16px 32px;background-color:#12121e;text-align:center;">
<p style="color:#555555;font-size:11px;margin:0;">Tourism Energy Intelligence · Automated alert · {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""
    return html


def _log_alert_history(
    country_code: str,
    stress_level: str,
    stress_score: float,
    recipient_email: str,
    status: str,
) -> None:
    """Insert a record into the alert_history table."""
    try:
        supabase = get_supabase()
        supabase.table("alert_history").insert({
            "country_code": country_code,
            "stress_level": stress_level,
            "stress_score": stress_score,
            "recipient_email": recipient_email,
            "status": status,
        }).execute()
    except Exception as e:
        logger.error("Failed to log alert history: %s", e)


def send_stress_alert(country_code: str, stress_data: dict) -> bool:
    """Send a stress alert email via SendGrid.

    Parameters
    ----------
    country_code : str
    stress_data : dict   full stress score result

    Returns
    -------
    bool — True if sent successfully
    """
    recipient = settings.alert_recipient_email
    if not recipient:
        logger.warning("ALERT_RECIPIENT_EMAIL not configured — cannot send alert")
        return False

    api_key = settings.sendgrid_api_key
    if not api_key:
        logger.warning("SENDGRID_API_KEY not configured — cannot send alert")
        return False

    html_body = format_alert_email(stress_data)

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email="alerts@tourism-energy-intelligence.com",
            to_emails=recipient,
            subject=(
                f"\U0001f6a8 {stress_data.get('stress_level', 'ALERT')} — "
                f"Energy Stress Alert: {COUNTRY_META.get(country_code, {}).get('name', country_code)}"
            ),
            html_content=html_body,
        )

        sg = SendGridAPIClient(api_key)
        response = sg.send(message)

        status_code = response.status_code
        sent = 200 <= status_code < 300

        _log_alert_history(
            country_code,
            stress_data.get("stress_level", ""),
            stress_data.get("stress_score", 0),
            recipient,
            "sent" if sent else f"failed ({status_code})",
        )

        if sent:
            logger.info("Alert sent for %s (score=%.1f, level=%s)",
                        country_code, stress_data.get("stress_score", 0),
                        stress_data.get("stress_level", ""))
        else:
            logger.warning("SendGrid returned %d for %s", status_code, country_code)

        return sent

    except Exception as e:
        logger.error("Failed to send alert for %s: %s", country_code, e)
        _log_alert_history(
            country_code,
            stress_data.get("stress_level", ""),
            stress_data.get("stress_score", 0),
            recipient,
            f"error: {e}",
        )
        return False


def check_and_alert_all_countries() -> dict[str, str]:
    """Evaluate stress scores for all countries and send alerts where needed.

    Returns
    -------
    dict of { country_code: "alerted" | "normal" | "failed" }
    """
    now = datetime.utcnow()
    year = now.year
    month = now.month

    results: dict[str, str] = {}

    for country in TARGET_COUNTRIES:
        try:
            stress = calculate_stress_score(country, year, month)
            level = stress.get("stress_level", "NORMAL")

            if level in ("CRITICAL", "ELEVATED"):
                sent = send_stress_alert(country, stress)
                results[country] = "alerted" if sent else "failed"
            else:
                results[country] = "normal"

        except Exception as e:
            logger.error("check_and_alert failed for %s: %s", country, e)
            results[country] = "failed"

    return results
