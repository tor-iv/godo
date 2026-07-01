"""
Celery tasks for scheduled event scraping.

These tasks run scrapers on a schedule to fetch events from various sources.
"""

import asyncio
import logging
from datetime import datetime

from app.celery import celery_app
from app.database import acquire

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
        # Determine sync status
        sync_status = "success" if result.error_message is None else "failed"

        # Upsert record by source_name (source_name has a UNIQUE constraint)
        async with acquire() as conn:
            await conn.execute(
                """
                INSERT INTO event_sources (
                    source_name, last_sync_at, last_sync_status,
                    events_found, events_new, events_updated,
                    error_message, is_enabled
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (source_name) DO UPDATE SET
                    last_sync_at = EXCLUDED.last_sync_at,
                    last_sync_status = EXCLUDED.last_sync_status,
                    events_found = EXCLUDED.events_found,
                    events_new = EXCLUDED.events_new,
                    events_updated = EXCLUDED.events_updated,
                    error_message = EXCLUDED.error_message,
                    is_enabled = EXCLUDED.is_enabled
                """,
                source_name,
                datetime.utcnow(),
                sync_status,
                result.events_found,
                result.events_new,
                result.events_updated,
                result.error_message,
                True,
            )

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


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_eventbrite")
def scrape_eventbrite(self):
    """Scrape Eventbrite events."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.eventbrite import EventbriteScraper

    logger.info("Starting Eventbrite scrape task")

    async def _run():
        async with EventbriteScraper() as scraper:
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


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_meetup")
def scrape_meetup(self):
    """Scrape Meetup events."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.meetup import MeetupScraper

    logger.info("Starting Meetup scrape task")

    async def _run():
        async with MeetupScraper() as scraper:
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


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_bandsintown")
def scrape_bandsintown(self):
    """Scrape Bandsintown concert listings."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.bandsintown import BandsintownScraper

    logger.info("Starting Bandsintown scrape task")

    async def _run():
        async with BandsintownScraper() as scraper:
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


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_opentable")
def scrape_opentable(self):
    """Scrape OpenTable restaurant reservation availability."""
    # Import inside task to avoid circular imports
    from scripts.scrapers.opentable import OpenTableScraper

    logger.info("Starting OpenTable scrape task")

    async def _run():
        async with OpenTableScraper() as scraper:
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

    # Run Eventbrite scraper
    try:
        eventbrite_result = scrape_eventbrite.delay().get()
        results.append(eventbrite_result)
        logger.info(f"Eventbrite scraper completed: {eventbrite_result}")
    except Exception as e:
        logger.error(f"Eventbrite scraper failed: {e}")
        results.append({
            "source": "eventbrite",
            "error": str(e),
        })

    # Run Meetup scraper
    try:
        meetup_result = scrape_meetup.delay().get()
        results.append(meetup_result)
        logger.info(f"Meetup scraper completed: {meetup_result}")
    except Exception as e:
        logger.error(f"Meetup scraper failed: {e}")
        results.append({
            "source": "meetup",
            "error": str(e),
        })

    # Run Bandsintown scraper
    try:
        bandsintown_result = scrape_bandsintown.delay().get()
        results.append(bandsintown_result)
        logger.info(f"Bandsintown scraper completed: {bandsintown_result}")
    except Exception as e:
        logger.error(f"Bandsintown scraper failed: {e}")
        results.append({
            "source": "bandsintown",
            "error": str(e),
        })

    # Run OpenTable scraper
    try:
        opentable_result = scrape_opentable.delay().get()
        results.append(opentable_result)
        logger.info(f"OpenTable scraper completed: {opentable_result}")
    except Exception as e:
        logger.error(f"OpenTable scraper failed: {e}")
        results.append({
            "source": "opentable",
            "error": str(e),
        })

    summary = {
        "scrapers_run": len(results),
        "results": results,
    }

    logger.info(f"scrape_all completed: {summary}")
    return summary
