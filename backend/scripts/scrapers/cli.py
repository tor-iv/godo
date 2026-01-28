"""
CLI for running event scrapers manually.

Usage:
    cd backend && python -m scripts.scrapers.cli nyc_parks --dry-run --verbose
    cd backend && python -m scripts.scrapers.cli all
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path
from typing import List

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.scrapers.nyc_parks import NYCParksScraper
from scripts.scrapers.nyc_open_data import NYCOpenDataScraper
from scripts.scrapers.ticketmaster import TicketmasterScraper
from scripts.scrapers.base import ScraperResult

logger = logging.getLogger(__name__)

# Registry of available scrapers
SCRAPERS = {
    "nyc_parks": NYCParksScraper,
    "nyc_open_data": NYCOpenDataScraper,
    "ticketmaster": TicketmasterScraper,
}


async def run_scraper(name: str, dry_run: bool, verbose: bool) -> ScraperResult:
    """
    Run a single scraper by name.

    Args:
        name: Name of the scraper (must be in SCRAPERS dict)
        dry_run: If True, don't write to database
        verbose: If True, enable verbose logging

    Returns:
        ScraperResult with statistics about the run

    Raises:
        ValueError: If scraper name is unknown
    """
    if name not in SCRAPERS:
        raise ValueError(f"Unknown scraper: {name}. Available: {list(SCRAPERS.keys())}")

    scraper_class = SCRAPERS[name]

    async with scraper_class(dry_run=dry_run, verbose=verbose) as scraper:
        result = await scraper.run()

    return result


async def run_all(dry_run: bool, verbose: bool) -> List[ScraperResult]:
    """
    Run all scrapers sequentially.

    Args:
        dry_run: If True, don't write to database
        verbose: If True, enable verbose logging

    Returns:
        List of ScraperResults for all scrapers
    """
    results: List[ScraperResult] = []

    for name in SCRAPERS:
        logger.info(f"Running scraper: {name}")
        try:
            result = await run_scraper(name, dry_run, verbose)
            results.append(result)
        except Exception as e:
            logger.error(f"Scraper {name} failed with error: {e}")
            # Create a failure result
            from datetime import datetime
            results.append(ScraperResult(
                source=name,
                events_found=0,
                events_new=0,
                events_updated=0,
                events_failed=0,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                error_message=str(e),
            ))

    return results


def print_summary(results: List[ScraperResult]) -> None:
    """
    Print a summary of all scraper results.

    Args:
        results: List of ScraperResults to summarize
    """
    print("\n" + "=" * 60)
    print("SCRAPER SUMMARY")
    print("=" * 60)

    total_new = 0
    total_updated = 0
    total_failed = 0

    for result in results:
        status = "SUCCESS" if result.error_message is None else "FAILED"
        print(
            f"[{result.source}] {status} - "
            f"Found: {result.events_found}, "
            f"New: {result.events_new}, "
            f"Updated: {result.events_updated}, "
            f"Failed: {result.events_failed} "
            f"({result.duration_seconds:.1f}s)"
        )

        total_new += result.events_new
        total_updated += result.events_updated
        total_failed += result.events_failed

    print("-" * 60)
    print(f"TOTAL: New: {total_new}, Updated: {total_updated}, Failed: {total_failed}")


def main() -> None:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Run event scrapers manually for testing and data ingestion.",
        epilog="Examples:\n"
               "  python -m scripts.scrapers.cli nyc_parks --dry-run --verbose\n"
               "  python -m scripts.scrapers.cli all\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "scraper",
        choices=list(SCRAPERS.keys()) + ["all"],
        help="Which scraper to run (or 'all' to run all scrapers)",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and transform but don't save to database",
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Print detailed output",
    )

    args = parser.parse_args()

    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )

    # Run the scraper(s)
    if args.scraper == "all":
        results = asyncio.run(run_all(args.dry_run, args.verbose))
    else:
        result = asyncio.run(run_scraper(args.scraper, args.dry_run, args.verbose))
        results = [result]

    # Print summary
    print_summary(results)

    # Exit with error code if any scraper failed
    has_errors = any(r.error_message is not None for r in results)
    if has_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
