"""Scheduled job manager using APScheduler.

Jobs
----
  1. Daily 08:00 UTC  — check_and_alert_all_countries()
  2. Monday 02:00 UTC — run_full_pipeline() for all countries (weekly ETL)
  3. 1st of month 03:00 UTC — train_all_countries() (monthly retrain)

Usage
-----
  from app.services.scheduler import start_scheduler

  In the FastAPI lifespan:
      start_scheduler()
"""

import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    """Initialise and start the BackgroundScheduler with all recurring jobs."""
    global _scheduler

    if _scheduler is not None:
        logger.warning("Scheduler already running — skipping re-initialisation")
        return

    _scheduler = BackgroundScheduler(daemon=True)

    _scheduler.add_job(
        _run_daily_alerts,
        trigger=CronTrigger(hour=8, minute=0, timezone="UTC"),
        id="daily_alerts",
        name="Daily stress alert check",
        replace_existing=True,
    )

    _scheduler.add_job(
        _run_weekly_etl,
        trigger=CronTrigger(day_of_week="mon", hour=2, minute=0, timezone="UTC"),
        id="weekly_etl",
        name="Weekly ETL pipeline refresh",
        replace_existing=True,
    )

    _scheduler.add_job(
        _run_monthly_training,
        trigger=CronTrigger(day=1, hour=3, minute=0, timezone="UTC"),
        id="monthly_training",
        name="Monthly model retraining",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        "Scheduler started — daily alerts (08:00 UTC), "
        "weekly ETL (Mon 02:00 UTC), monthly training (1st 03:00 UTC)"
    )


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")


def _run_daily_alerts() -> None:
    """Job: evaluate stress scores and send alerts."""
    logger.info("Scheduled job: daily alert check")
    try:
        from app.services.alerts import check_and_alert_all_countries
        results = check_and_alert_all_countries()
        alerted = [k for k, v in results.items() if v == "alerted"]
        if alerted:
            logger.info("Alerts sent for: %s", ", ".join(alerted))
        else:
            logger.info("No alerts required")
    except Exception as e:
        logger.error("Daily alert job failed: %s", e, exc_info=True)


def _run_weekly_etl() -> None:
    """Job: run the full ETL pipeline for all countries."""
    logger.info("Scheduled job: weekly ETL pipeline")
    try:
        from app.etl.pipeline import run_all_countries

        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(run_all_countries())
            successful = sum(1 for df in results.values() if not df.empty)
            logger.info("Weekly ETL complete — %d/%d countries succeeded", successful, len(results))
        finally:
            loop.close()
    except Exception as e:
        logger.error("Weekly ETL job failed: %s", e, exc_info=True)


def _run_monthly_training() -> None:
    """Job: retrain all ML models."""
    logger.info("Scheduled job: monthly model training")
    try:
        from app.ml.train import train_all_countries
        summary = train_all_countries()
        trained = [c for c, v in summary.items() if "xgboost" in v]
        logger.info("Monthly training complete — models trained for: %s", ", ".join(trained))
    except Exception as e:
        logger.error("Monthly training job failed: %s", e, exc_info=True)
