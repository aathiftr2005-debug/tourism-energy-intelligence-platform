"""Local analytics engine — fallback AI assistant when Gemini is unavailable.

Provides intent classification, data querying from Supabase, and
natural-language response generation using local tourism, energy,
stress, and forecast datasets.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.database import get_supabase
from app.etl.utils import TARGET_COUNTRIES
from app.ml.stress_score import calculate_all_countries, calculate_stress_score

_OVERVIEW_KEYWORDS = [
    "countries", "europe", "european", "overview",
    "show all", "all countries", "all stress", "all scores",
    "compare all", "compare every",
]

logger = logging.getLogger(__name__)

COUNTRY_NAMES: dict[str, str] = {
    "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy",
    "AT": "Austria", "GR": "Greece", "PT": "Portugal", "NL": "Netherlands",
    "BE": "Belgium", "CZ": "Czech Republic",
}


def _detect_country(message: str) -> Optional[str]:
    """Detect which country the user is asking about from their message.
    
    Uses word boundaries for short 2-letter codes to avoid false matches
    (e.g., \"es\" in \"countries\", \"it\" in \"attention\", \"at\" in \"that\").
    """
    msg_lower = message.lower()
    for code, name in COUNTRY_NAMES.items():
        if name.lower() in msg_lower:
            return code
        if re.search(r"\b" + re.escape(code.lower()) + r"\b", msg_lower):
            return code
    return None


def _detect_intent(message: str) -> str:
    """Classify the user's question intent based on keywords."""
    msg = message.lower()

    if any(kw in msg for kw in [
        "stress", "score", "critical", "elevated", "alert",
        "traffic light", "status", "attention", "urgent",
        "immediate", "watch", "monitor", "priority", "risk",
    ]):
        return "stress"
    if any(kw in msg for kw in [
        "forecast", "prediction", "future", "next month",
        "outlook", "trend", "projection",
    ]):
        return "forecast"
    if any(kw in msg for kw in [
        "energy", "consumption", "power", "electricity",
        "grid", "gwh", "demand",
    ]):
        return "energy"
    if any(kw in msg for kw in [
        "tourism", "tourist", "visitor", "travel",
        "hotel", "accommodation",
    ]):
        return "tourism"
    if any(kw in msg for kw in [
        "compare", "vs", "versus", "difference", "rank",
        "ranking", "top", "highest", "lowest", "worst", "best",
    ]):
        return "comparison"
    if any(kw in msg for kw in [
        "explain", "why", "how", "what cause", "reason",
        "factor", "contribut", "calculation", "formula",
        "compose", "made up of", "breakdown", "works",
    ]):
        return "explanation"

    return "general"


def _join_names(names: list[str]) -> str:
    """Join a list of country names into a natural English list."""
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f", and {names[-1]}"


def _month_name(m: int) -> str:
    names = ["January", "February", "March", "April", "May", "June",
             "July", "August", "September", "October", "November", "December"]
    return names[m - 1] if 1 <= m <= 12 else str(m)


def _is_overview_query(message: str) -> bool:
    """Check if the user is asking for a multi-country overview."""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in _OVERVIEW_KEYWORDS)


def _get_stress_summary(country_code: Optional[str] = None) -> str:
    """Generate a natural-language stress score briefing."""
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month

    if country_code:
        result = calculate_stress_score(country_code, year, month)
        name = COUNTRY_NAMES.get(country_code, country_code)
        score = result.get("stress_score", 0)
        level = result.get("stress_level", "NORMAL")
        factors = result.get("contributing_factors", {})
        rec = result.get("recommendation", "")

        if level == "CRITICAL":
            parts = [
                f"{name} is currently experiencing critical energy stress "
                f"with a score of {score:.1f}. This indicates that energy "
                f"demand is significantly outpacing normal levels, and "
                f"immediate measures are needed to maintain grid stability."
            ]
        elif level == "ELEVATED":
            parts = [
                f"{name} has an elevated stress score of {score:.1f}, "
                f"meaning energy demand is notably higher than usual. "
                f"Close monitoring and proactive preparation are "
                f"recommended to manage potential impacts on infrastructure."
            ]
        else:
            parts = [
                f"{name} is operating under normal conditions with a "
                f"stress score of {score:.1f}. Energy demand remains "
                f"within expected ranges and no immediate action is needed."
            ]

        if factors:
            sorted_factors = sorted(
                factors.items(), key=lambda x: x[1], reverse=True
            )
            top = sorted_factors[0]
            label = top[0].replace("_", " ").title()
            pct = top[1] * 100
            parts.append(
                f"The primary driver is {label.lower()}, which contributes "
                f"{pct:.1f}% to the overall score."
            )

        parts.append(rec)
        return " ".join(parts)

    all_scores = calculate_all_countries(year, month)
    sorted_items = sorted(
        all_scores.items(),
        key=lambda x: x[1].get("stress_score", 0),
        reverse=True,
    )

    scores_list = [d.get("stress_score", 0) for d in all_scores.values()]
    avg = sum(scores_list) / max(len(scores_list), 1)

    critical = [
        (c, d) for c, d in sorted_items
        if d.get("stress_level") == "CRITICAL"
    ]
    elevated = [
        (c, d) for c, d in sorted_items
        if d.get("stress_level") == "ELEVATED"
    ]
    normal = [
        (c, d) for c, d in sorted_items
        if d.get("stress_level") == "NORMAL"
    ]

    paragraphs = []

    if critical:
        crit_names = _join_names(
            [COUNTRY_NAMES.get(c, c) for c, _ in critical]
        )
        elev_names = _join_names(
            [COUNTRY_NAMES.get(c, c) for c, _ in elevated]
        ) if elevated else ""
        paragraphs.append(
            f"Europe is currently experiencing a period of heightened "
            f"energy stress, with {crit_names} facing critical conditions. "
            f"These countries require immediate operational attention to "
            f"maintain grid stability."
        )
        if elev_names:
            paragraphs.append(
                f"{elev_names} also show elevated stress levels and should "
                f"be monitored closely as the situation develops."
            )
    elif elevated:
        top_elev = elevated[:3]
        rest_elev = elevated[3:]
        top_names = _join_names(
            [COUNTRY_NAMES.get(c, c) for c, _ in top_elev]
        )
        paragraphs.append(
            f"Europe is currently experiencing a moderate level of energy "
            f"stress. While the overall situation remains stable, "
            f"{top_names} require closer monitoring as tourism activity "
            f"and energy demand continue to increase."
        )
        paragraphs.append(
            f"{top_names} should be considered the highest operational "
            f"priorities due to their comparatively higher stress levels. "
            f"Early intervention and continuous monitoring can help reduce "
            f"pressure on energy infrastructure during peak demand periods."
        )
        if rest_elev:
            rest_names = _join_names(
                [COUNTRY_NAMES.get(c, c) for c, _ in rest_elev]
            )
            paragraphs.append(
                f"{rest_names} also show elevated stress levels, although "
                f"the current outlook remains manageable with proactive "
                f"planning and efficient resource allocation."
            )
    else:
        paragraphs.append(
            f"All monitored European countries are currently operating "
            f"within normal energy stress ranges, reflecting stable "
            f"conditions across the region. No country requires immediate "
            f"intervention at this time."
        )

    if normal:
        normal_names = _join_names(
            [COUNTRY_NAMES.get(c, c) for c, _ in normal]
        )
        paragraphs.append(
            f"{normal_names} {'is' if len(normal) == 1 else 'are'} "
            f"currently operating within normal conditions and "
            f"{'does' if len(normal) == 1 else 'do'} not require "
            f"immediate intervention."
        )

    if critical:
        paragraphs.append(
            f"Activating emergency reserves and implementing demand-side "
            f"management measures are recommended for the affected regions "
            f"as a priority."
        )
    elif elevated:
        paragraphs.append(
            f"Overall, Europe remains stable, but continued monitoring is "
            f"recommended throughout the upcoming tourism season."
        )
    else:
        paragraphs.append(
            f"Standard monitoring is sufficient at this time."
        )

    return "\n\n".join(paragraphs)


def _get_forecast_summary(country_code: Optional[str] = None) -> str:
    """Generate a natural-language forecast briefing."""
    try:
        from app.ml.forecast import forecast_all_countries, generate_ensemble_forecast
    except Exception:
        logger.exception("Forecast module import failed")
        return "I am sorry, but the forecast data is not available at this time. Please try again shortly."

    if country_code:
        try:
            forecast = generate_ensemble_forecast(country_code, months_ahead=6)
            name = COUNTRY_NAMES.get(country_code, country_code)
            if forecast.empty:
                return (
                    f"Forecast data for {name} is not yet available. "
                    f"Please check back again once more data has been "
                    f"collected."
                )

            current = forecast["ensemble_prediction"].iloc[0]
            future = forecast["ensemble_prediction"].iloc[-1]
            lower = forecast["lower_bound"].min()
            upper = forecast["upper_bound"].max()

            if len(forecast) > 1 and current:
                change = ((future - current) / current) * 100
                months_ahead = len(forecast)

                if change > 3:
                    parts = [
                        f"Energy demand in {name} is expected to rise by "
                        f"around {abs(change):.1f}% over the next "
                        f"{months_ahead} months, with consumption projected "
                        f"to range between {lower:.0f} and {upper:.0f} GWh. "
                        f"This upward trend may put additional pressure on "
                        f"the grid, particularly if peak tourism season "
                        f"brings above-average temperatures. Securing "
                        f"additional reserves and coordinating with regional "
                        f"operators would be a prudent step.",
                    ]
                elif change < -3:
                    parts = [
                        f"Energy demand in {name} is projected to decline "
                        f"by about {abs(change):.1f}% over the next "
                        f"{months_ahead} months, with estimates ranging "
                        f"from {lower:.0f} to {upper:.0f} GWh. This "
                        f"downward trend offers some operational relief, "
                        f"though weather-related volatility could still "
                        f"reverse the pattern. This period provides a good "
                        f"window for scheduled maintenance and grid "
                        f"efficiency reviews.",
                    ]
                else:
                    parts = [
                        f"Energy demand in {name} is expected to remain "
                        f"stable over the next {months_ahead} months, "
                        f"with consumption projected at around "
                        f"{future:.0f} GWh and a range of {lower:.0f} "
                        f"to {upper:.0f} GWh. No significant shifts in "
                        f"demand are anticipated, and current reserve "
                        f"levels should be sufficient.",
                    ]
            else:
                parts = [
                    f"The outlook for {name} points to stable energy "
                    f"demand at approximately {future:.0f} GWh over "
                    f"the coming months.",
                ]

            return "\n\n".join(parts)

        except Exception:
            logger.exception("Forecast failed for %s", country_code)
            name = COUNTRY_NAMES.get(country_code, country_code)
            return (
                f"I am sorry, but the forecast for {name} is not "
                f"available at this time. Please try again shortly."
            )

    try:
        results = forecast_all_countries(months_ahead=6)
        changes = {}
        for code in TARGET_COUNTRIES:
            name = COUNTRY_NAMES.get(code, code)
            df = results.get(code)
            if df is not None and not df.empty and len(df) > 1:
                current = df["ensemble_prediction"].iloc[0]
                future = df["ensemble_prediction"].iloc[-1]
                if current:
                    change = ((future - current) / current) * 100
                    changes[name] = change

        if not changes:
            return "Forecast data across Europe is being updated and is not available at this time. Please try again shortly."

        rising = {k: v for k, v in changes.items() if v > 2}
        declining = {k: v for k, v in changes.items() if v < -2}
        stable = {k: v for k, v in changes.items() if -2 <= v <= 2}

        rising_sorted = sorted(rising.items(), key=lambda x: x[1], reverse=True)
        decl_names = _join_names(list(declining.keys())) if declining else ""
        stable_names = _join_names(list(stable.keys())) if stable else ""

        details = []
        if rising_sorted:
            top = rising_sorted[0]
            details.append(
                f"{top[0]} is expected to see the largest increase at "
                f"around {abs(top[1]):.1f}%"
            )
            if len(rising_sorted) > 1:
                next_rise = rising_sorted[1]
                details.append(
                    f"followed by {next_rise[0]} at {abs(next_rise[1]):.1f}%"
                )

        if decl_names:
            verb = "shows" if len(declining) == 1 else "show"
            details.append(
                f"while {decl_names} {verb} a projected decline, "
                f"offering some operational relief"
            )

        if stable_names:
            verb = "is" if len(stable) == 1 else "are"
            details.append(
                f"and {stable_names} {verb} expected to remain stable"
            )

        intro = "Looking at energy demand projections across Europe over the coming months, "
        body = ", ".join(details) + "."
        closing = (
            " Overall, the European energy outlook remains manageable, "
            "though continued monitoring of the countries with rising "
            "demand is recommended as peak tourism periods approach."
        )

        return intro + body + closing

    except Exception:
        logger.exception("All-forecast summary failed")
        return "I am sorry, but the forecast data is not available at this time. Please try again shortly."


def _get_energy_summary(country_code: Optional[str] = None) -> str:
    """Generate a natural-language energy consumption briefing."""
    try:
        supabase = get_supabase()

        if country_code:
            response = (
                supabase.table("energy_tourism_data")
                .select("country_code,year,month,energy_consumption_gwh")
                .eq("country_code", country_code)
                .order("year", desc=True)
                .order("month", desc=True)
                .limit(6)
                .execute()
            )
            records = response.data or []
            if not records:
                name = COUNTRY_NAMES.get(country_code, country_code)
                return (
                    f"Energy consumption data for {name} is not yet "
                    f"available. Please check back after the next data update."
                )

            name = COUNTRY_NAMES.get(country_code, country_code)
            latest = records[0]
            vals = [r.get("energy_consumption_gwh", 0) or 0 for r in records]
            avg = sum(vals) / len(vals)
            latest_val = latest.get("energy_consumption_gwh", 0) or 0
            latest_month = _month_name(latest.get("month", 0))
            latest_year = latest.get("year", 0)

            if len(records) >= 3:
                recent = sum(vals[:3]) / 3
                early = sum(vals[-3:]) / 3
                if early:
                    trend_pct = ((recent - early) / early) * 100
                else:
                    trend_pct = 0
            else:
                trend_pct = 0

            if trend_pct > 2:
                trend_text = (
                    f"reflects an increase of {trend_pct:.1f}% compared to "
                    f"earlier months, suggesting growing demand that may be "
                    f"linked to rising tourism activity."
                )
            elif trend_pct < -2:
                trend_text = (
                    f"shows a decline of {abs(trend_pct):.1f}% relative to "
                    f"previous months, signalling reduced demand during "
                    f"this period."
                )
            else:
                trend_text = (
                    f"remains stable with minimal variation, indicating "
                    f"consistent demand patterns."
                )

            parts = [
                f"{name} is consuming an average of {avg:.0f} GWh per month "
                f"based on recent data, with the latest reading at "
                f"{latest_val:.0f} GWh in {latest_month} {latest_year}. "
                f"This {trend_text}"
            ]

            if trend_pct > 2:
                parts.append(
                    f"Monitoring this upward trajectory closely is advisable, "
                    f"particularly as peak tourism periods approach. Reviewing "
                    f"supply capacity and assessing seasonal load patterns "
                    f"would be prudent steps."
                )
            elif trend_pct < -2:
                parts.append(
                    f"This period of reduced demand offers a good opportunity "
                    f"to schedule maintenance and review grid efficiency "
                    f"measures."
                )
            else:
                parts.append(
                    f"Current reserve levels and operational procedures "
                    f"appear adequate for the near term."
                )

            return "\n\n".join(parts)

        records_by_country = {}
        for code in TARGET_COUNTRIES:
            response = (
                supabase.table("energy_tourism_data")
                .select("energy_consumption_gwh")
                .eq("country_code", code)
                .order("year", desc=True)
                .order("month", desc=True)
                .limit(3)
                .execute()
            )
            recs = response.data or []
            if recs:
                vals = [r.get("energy_consumption_gwh", 0) or 0 for r in recs]
                records_by_country[code] = sum(vals) / len(vals)

        if not records_by_country:
            return "Energy consumption data across Europe is being updated and is not available at this time. Please try again shortly."

        sorted_items = sorted(
            records_by_country.items(), key=lambda x: x[1], reverse=True
        )
        top = sorted_items[:3]
        parts = [
            "Looking at energy consumption across Europe, "
            + ", ".join(
                f"{COUNTRY_NAMES.get(c, c)} leads at {v:.0f} GWh per month"
                if i == 0 else
                f"{COUNTRY_NAMES.get(c, c)} at {v:.0f} GWh"
                for i, (c, v) in enumerate(top)
            )
            + ". These are the highest-demand countries in the region."
        ]

        if len(sorted_items) > 3:
            rest = _join_names(
                [COUNTRY_NAMES.get(c, c) for c, _ in sorted_items[3:]]
            )
            parts.append(
                f"{rest} show lower consumption levels, with most "
                f"countries operating well under the regional average."
            )

        parts.append(
            "Overall, energy demand across Europe remains consistent "
            "with seasonal expectations. Standard monitoring procedures "
            "are sufficient at this time."
        )
        return "\n\n".join(parts)

    except Exception as e:
        logger.error("Energy summary failed: %s", e)
        return "I am sorry, but energy consumption data is not available at this time. Please try again shortly."


def _get_tourism_summary(country_code: Optional[str] = None) -> str:
    """Generate a natural-language tourism activity briefing."""
    try:
        supabase = get_supabase()

        if country_code:
            response = (
                supabase.table("energy_tourism_data")
                .select("country_code,year,month,tourist_nights,tourist_intensity")
                .eq("country_code", country_code)
                .order("year", desc=True)
                .order("month", desc=True)
                .limit(6)
                .execute()
            )
            records = response.data or []
            if not records:
                name = COUNTRY_NAMES.get(country_code, country_code)
                return (
                    f"Tourism data for {name} is not yet available. "
                    f"Please check back after the next data update."
                )

            name = COUNTRY_NAMES.get(country_code, country_code)
            latest = records[0]
            latest_month = _month_name(latest.get("month", 0))
            latest_year = latest.get("year", 0)
            total_nights = sum(r.get("tourist_nights", 0) or 0 for r in records)
            latest_nights = latest.get("tourist_nights", 0) or 0
            intensity = latest.get("tourist_intensity", "N/A")

            avg_nights = total_nights / len(records) if records else 0
            if avg_nights:
                deviation = ((latest_nights - avg_nights) / avg_nights) * 100
                if deviation > 10:
                    season_note = (
                        f"approximately {abs(deviation):.0f}% above "
                        f"the recent average of {avg_nights:.0f}, "
                        f"indicating peak tourism season activity."
                    )
                elif deviation < -10:
                    season_note = (
                        f"approximately {abs(deviation):.0f}% below "
                        f"the recent average of {avg_nights:.0f}, "
                        f"consistent with an off-peak period."
                    )
                else:
                    season_note = (
                        f"in line with the recent average of "
                        f"{avg_nights:.0f}."
                    )
            else:
                season_note = "based on the latest available data."

            parts = [
                f"In {latest_month} {latest_year}, {name} recorded "
                f"{latest_nights:.0f} tourist nights, which is "
                f"{season_note}"
            ]

            if isinstance(intensity, (int, float)):
                if intensity > 0.7:
                    parts.append(
                        f"With a tourist intensity index of {intensity:.2f}, "
                        f"the number of visitors relative to the local "
                        f"population is placing notable pressure on "
                        f"infrastructure. Monitoring accommodation occupancy "
                        f"and preparing for seasonal energy demand increases "
                        f"would be advisable."
                    )
                elif intensity > 0.4:
                    parts.append(
                        f"The tourist intensity index stands at "
                        f"{intensity:.2f}, indicating moderate visitor "
                        f"pressure on local infrastructure that remains "
                        f"manageable under current conditions."
                    )
                else:
                    parts.append(
                        f"With a tourist intensity index of {intensity:.2f}, "
                        f"visitor numbers remain modest relative to the "
                        f"population, suggesting minimal tourism-driven "
                        f"energy stress at this time."
                    )

            return "\n\n".join(parts)

        records_by_country = {}
        for code in TARGET_COUNTRIES:
            response = (
                supabase.table("energy_tourism_data")
                .select("tourist_nights,tourist_intensity")
                .eq("country_code", code)
                .order("year", desc=True)
                .order("month", desc=True)
                .limit(1)
                .execute()
            )
            recs = response.data or []
            if recs:
                records_by_country[code] = recs[0]

        if not records_by_country:
            return "Tourism data across Europe is being updated and is not available at this time. Please try again shortly."

        sorted_items = sorted(
            records_by_country.items(),
            key=lambda x: x[1].get("tourist_nights", 0) or 0,
            reverse=True,
        )
        top = sorted_items[:3]
        parts = [
            "Looking at tourism activity across Europe, "
            + ", ".join(
                f"{COUNTRY_NAMES.get(c, c)} leads with "
                f"{r.get('tourist_nights', 0):.0f} tourist nights"
                if i == 0 else
                f"{COUNTRY_NAMES.get(c, c)} at "
                f"{r.get('tourist_nights', 0):.0f}"
                for i, (c, r) in enumerate(top)
            )
            + ". These are the most visited destinations in the region."
        ]

        high_intensity = [
            COUNTRY_NAMES.get(c, c) for c, r in sorted_items
            if isinstance(r.get("tourist_intensity"), (int, float))
            and r["tourist_intensity"] > 0.6
        ]
        if high_intensity:
            parts.append(
                f"{_join_names(high_intensity)} show{'s' if len(high_intensity) == 1 else ''} "
                f"a high ratio of visitors to local population, which may "
                f"translate into increased energy demand during peak periods."
            )

        parts.append(
            "Overall, tourism activity remains consistent with seasonal "
            "expectations across the region."
        )
        return "\n\n".join(parts)

    except Exception as e:
        logger.error("Tourism summary failed: %s", e)
        return "I am sorry, but tourism data is not available at this time. Please try again shortly."


def _get_comparison_summary(message: str) -> str:
    """Generate a natural-language country comparison briefing."""
    msg_lower = message.lower()
    detected = [
        code for code in TARGET_COUNTRIES
        if code.lower() in msg_lower
        or COUNTRY_NAMES.get(code, "").lower() in msg_lower
    ]

    now = datetime.now(timezone.utc)
    all_scores = calculate_all_countries(now.year, now.month)
    sorted_scores = sorted(
        all_scores.items(), key=lambda x: x[1].get("stress_score", 0), reverse=True
    )

    if len(detected) >= 2:
        a, b = detected[:2]
    elif len(detected) == 1:
        a = detected[0]
        b = None
    else:
        a = None
        b = None

    if a and b:
        name_a = COUNTRY_NAMES.get(a, a)
        name_b = COUNTRY_NAMES.get(b, b)
        score_a = calculate_stress_score(a, now.year, now.month)
        score_b = calculate_stress_score(b, now.year, now.month)
        sa = score_a.get("stress_score", 0)
        sb = score_b.get("stress_score", 0)
        la = score_a.get("stress_level", "NORMAL")
        lb = score_b.get("stress_level", "NORMAL")
        diff = sa - sb
        higher = name_a if diff > 0 else name_b
        spread = abs(diff)

        if spread > 15:
            gap = f"a significant gap of {spread:.1f} points"
        elif spread > 5:
            gap = f"a moderate difference of {spread:.1f} points"
        else:
            gap = f"only {spread:.1f} points separating them"

        factors_a = score_a.get("contributing_factors", {})
        factors_b = score_b.get("contributing_factors", {})
        top_a = (
            max(factors_a, key=factors_a.get).replace("_", " ")
            if factors_a else ""
        )
        top_b = (
            max(factors_b, key=factors_b.get).replace("_", " ")
            if factors_b else ""
        )

        parts = [
            f"Comparing {name_a} and {name_b}: {name_a} has a stress "
            f"score of {sa:.1f}, placing it in {la.lower()} status, "
            f"while {name_b} scores {sb:.1f} in {lb.lower()} status. "
            f"This represents {gap}, with {higher} experiencing "
            f"{'higher' if diff > 0 else 'lower'} energy stress."
        ]

        if top_a or top_b:
            diff_note = (
                f"The primary differentiator is "
                f"{top_a.title() if top_a else 'unknown factors'} "
                f"for {name_a} and "
                f"{top_b.title() if top_b else 'unknown factors'} "
                f"for {name_b}."
            )
            parts.append(diff_note)

        if max(sa, sb) >= 50:
            if sa >= 50 and sb >= 50:
                parts.append(
                    f"Both countries require attention, with regional "
                    f"coordination recommended to manage elevated stress "
                    f"levels effectively."
                )
            elif sa >= 50:
                rec = score_a.get("recommendation", "")
                parts.append(
                    f"{name_a} requires attention: {rec}"
                    if rec else
                    f"{name_a} requires closer operational monitoring."
                )
            else:
                rec = score_b.get("recommendation", "")
                parts.append(
                    f"{name_b} requires attention: {rec}"
                    if rec else
                    f"{name_b} requires closer operational monitoring."
                )

        return "\n\n".join(parts)

    if a:
        name = COUNTRY_NAMES.get(a, a)
        rank = next(
            (i + 1 for i, (c, _) in enumerate(sorted_scores) if c == a),
            None,
        )
        if rank:
            total = len(sorted_scores)
            score = dict(sorted_scores).get(a, {}).get("stress_score", 0)
            level = dict(sorted_scores).get(a, {}).get("stress_level", "NORMAL")
            if rank <= 3:
                position = "among the highest-stress countries, requiring close attention"
            elif rank >= total - 2:
                position = "among the lowest-stress countries, indicating stable conditions"
            else:
                position = "in the mid-range of monitored countries"

            return (
                f"{name} currently ranks {rank} out of {total} monitored "
                f"countries with a stress score of {score:.1f} ({level.lower()}). "
                f"This places it {position}."
            )
        return (
            f"Ranking data for {name} is not currently available."
        )

    if sorted_scores:
        top_c, top_d = sorted_scores[0]
        bot_c, bot_d = sorted_scores[-1]
        top_name = COUNTRY_NAMES.get(top_c, top_c)
        bot_name = COUNTRY_NAMES.get(bot_c, bot_c)
        top_score = top_d.get("stress_score", 0)
        bot_score = bot_d.get("stress_score", 0)
        diff = top_score - bot_score

        return (
            f"Across the monitored European countries, {top_name} has the "
            f"highest stress level at {top_score:.1f}, while {bot_name} "
            f"has the lowest at {bot_score:.1f} \u2014 a spread of "
            f"{diff:.1f} points across the region."
        )

    return (
        "I am sorry, but comparison data is not available at this time. "
        "Please try again shortly."
    )


def _get_explanation_summary(country_code: Optional[str] = None) -> str:
    """Generate a natural-language explanation of the stress score."""
    parts = [
        "The stress score measures how tourism activity puts pressure on "
        "each country's energy grid. It combines several factors into a "
        "single indicator that helps operators understand where to focus "
        "their attention.",
        "",
        "The first factor is tourist intensity, which looks at the number "
        "of visitors relative to the local population. The second is air "
        "travel dependency, which captures how reliant a country is on "
        "flights for its tourism inflows. The third factor considers how "
        "temperature variations influence energy consumption. And the "
        "fourth compares current energy demand against historical patterns "
        "to flag unusual shifts.",
        "",
        "Based on these combined factors, a country is classified as "
        "normal, elevated, or critical. A normal rating means conditions "
        "are within expected ranges. An elevated rating signals that "
        "closer monitoring and proactive measures are advisable. A "
        "critical rating indicates that immediate action may be needed "
        "to maintain energy grid stability.",
    ]

    if country_code:
        now = datetime.now(timezone.utc)
        result = calculate_stress_score(country_code, now.year, now.month)
        name = COUNTRY_NAMES.get(country_code, country_code)
        score = result.get("stress_score", 0)
        level = result.get("stress_level", "NORMAL")
        factors = result.get("contributing_factors", {})
        rec = result.get("recommendation", "")

        example = [
            "",
            f"For {name}, the current score is {score:.1f}, placing it "
            f"in the {level.lower()} category.",
        ]

        if factors:
            sorted_factors = sorted(
                factors.items(), key=lambda x: x[1], reverse=True
            )
            top = sorted_factors[0]
            label = top[0].replace("_", " ").title()
            pct = top[1] * 100
            example.append(
                f"The largest contributor is {label.lower()}, which accounts "
                f"for {pct:.1f}% of the score."
            )

        if rec:
            example.append(rec)

        parts.extend(example)

    return "\n".join(parts)


def generate_local_response(message: str) -> str:
    """Main entry point — generate a natural-language response from local data.

    Classifies the user's intent, fetches the relevant data from Supabase
    and local ML services, and composes a structured reply.
    """
    try:
        country = _detect_country(message)
        intent = _detect_intent(message)
        is_overview = _is_overview_query(message)

        logger.info("Local assistant: intent=%s, country=%s, overview=%s", intent, country, is_overview)

        # Overview/ranking queries without a specific country always get the
        # full European stress table — never a single-country response.
        if is_overview and country is None:
            return _get_stress_summary()

        if intent == "stress":
            return _get_stress_summary(country)
        if intent == "forecast":
            return _get_forecast_summary(country)
        if intent == "energy":
            return _get_energy_summary(country)
        if intent == "tourism":
            return _get_tourism_summary(country)
        if intent == "comparison":
            return _get_comparison_summary(message)
        if intent == "explanation":
            return _get_explanation_summary(country)

        return _get_stress_summary()

    except Exception as e:
        logger.error("Local assistant failed: %s", e, exc_info=True)
        return (
            "I am sorry, but I am unable to retrieve the latest information "
            "at this time. Please try again shortly."
        )
