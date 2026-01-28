"""
Celery tasks for scheduled event scraping.

These tasks run scrapers on a schedule to fetch events from various sources.
"""

import asyncio
import logging
from datetime import datetime

from app.celery import celery_app
from app.database import db_manager

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in sync Celery task."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _log_scraper_run(source_name: str, result) -> None:
    """
    Log scraper run results to event_sources table.

    Args:
        source_name: The source identifier (e.g., 'nyc_parks')
        result: ScraperResult from the scraper run
    """
    try:
        supabase = db_manager.supabase_admin
        if supabase is None:
            logger.warning("Supabase admin client not available for logging scraper run")
            return

        # Determine sync status
        sync_status = "success" if result.error_message is None else "failed"

        # Upsert record by source_name
        record = {
            "source_name": source_name,
            "last_sync_at": datetime.utcnow().isoformat(),
            "last_sync_status": sync_status,
            "events_found": result.events_found,
            "events_new": result.events_new,
            "events_updated": result.events_updated,
            "error_message": result.error_message,
            "is_enabled": True,
        }

        supabase.table("event_sources").upsert(
            record,
            on_conflict="source_name"
        ).execute()

        logger.info(f"Logged scraper run for {source_name}: {sync_status}")

    except Exception as e:
        logger.error(f"Failed to log scraper run for {source_name}: {e}")
        # Don't fail the task if logging fails


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_nyc_parks")
def scrape_nyc_parks(self):
    """Scrape NYC Parks events."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.nyc_parks import NYCParksScraper

    logger.info("Starting NYC Parks scrape task")

    async def _run():
        async with NYCParksScraper() as scraper:
            result = await scraper.run()
            await _log_scraper_run(scraper.source.value, result)
            return {
                "source": result.source,
                "events_found": result.events_found,
                "events_new": result.events_new,
                "events_updated": result.events_updated,
                "events_failed": result.events_failed,
                "error": result.error_message,
            }

    return run_async(_run())


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_nyc_open_data")
def scrape_nyc_open_data(self):
    """Scrape NYC Open Data events."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.nyc_open_data import NYCOpenDataScraper

    logger.info("Starting NYC Open Data scrape task")

    async def _run():
        async with NYCOpenDataScraper() as scraper:
            result = await scraper.run()
            await _log_scraper_run(scraper.source.value, result)
            return {
                "source": result.source,
                "events_found": result.events_found,
                "events_new": result.events_new,
                "events_updated": result.events_updated,
                "events_failed": result.events_failed,
                "error": result.error_message,
            }

    return run_async(_run())


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_ticketmaster")
def scrape_ticketmaster(self):
    """Scrape Ticketmaster events."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.ticketmaster import TicketmasterScraper

    logger.info("Starting Ticketmaster scrape task")

    async def _run():
        async with TicketmasterScraper() as scraper:
            result = await scraper.run()
            await _log_scraper_run(scraper.source.value, result)
            return {
                "source": result.source,
                "events_found": result.events_found,
                "events_new": result.events_new,
                "events_updated": result.events_updated,
                "events_failed": result.events_failed,
                "error": result.error_message,
            }

    return run_async(_run())


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_all")
def scrape_all(self):
    """
    Run all scrapers.

    Returns a summary dict with count and individual results.
    """
    logger.info("Starting scrape_all task")

    results = []

    # Run NYC Parks scraper
    try:
        parks_result = scrape_nyc_parks.delay().get()
        results.append(parks_result)
        logger.info(f"NYC Parks scraper completed: {parks_result}")
    except Exception as e:
        logger.error(f"NYC Parks scraper failed: {e}")
        results.append({
            "source": "nyc_parks",
            "error": str(e),
        })

    # Run NYC Open Data scraper
    try:
        open_data_result = scrape_nyc_open_data.delay().get()
        results.append(open_data_result)
        logger.info(f"NYC Open Data scraper completed: {open_data_result}")
    except Exception as e:
        logger.error(f"NYC Open Data scraper failed: {e}")
        results.append({
            "source": "nyc_open_data",
            "error": str(e),
        })

    # Run Ticketmaster scraper
    try:
        ticketmaster_result = scrape_ticketmaster.delay().get()
        results.append(ticketmaster_result)
        logger.info(f"Ticketmaster scraper completed: {ticketmaster_result}")
    except Exception as e:
        logger.error(f"Ticketmaster scraper failed: {e}")
        results.append({
            "source": "ticketmaster",
            "error": str(e),
        })

    summary = {
        "scrapers_run": len(results),
        "results": results,
    }

    logger.info(f"scrape_all completed: {summary}")
    return summary
