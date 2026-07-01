"""
Celery task for the optional "Connect Google Calendar" feature.

Best-effort, create-only sync: when a user swipes "going" on an event
(app/routers/swipes.py), we fire-and-forget this task to mirror that event
into the user's primary Google Calendar if (and only if) they've connected
one via app/routers/integrations.py. No free/busy conflict-checking, no
updates/deletes if the godo event later changes -- that's explicitly out of
scope for this feature.

NOTE on refresh token longevity: while the Google OAuth consent screen for
this app is in "Testing" publishing status, refresh tokens Google issues to
it expire after 7 days of the app being unverified. A user's stored
refresh_token can therefore go stale and this task will start failing (logged,
not raised) until they reconnect via /integrations/google/connect. Moving the
OAuth consent screen to "In production" / verified status is a Google Cloud
Console configuration step for the operator -- not something to work around
here.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

# Note: google-auth / googleapiclient imports are deferred into the
# functions that use them (below), not done at module level. This module is
# imported from app.routers.swipes (the core swipe endpoint) via the
# `app.celery` task registry, so a missing/broken google-auth install must
# not prevent the whole app from starting -- this is an OPTIONAL feature.

from app.celery import celery_app
from app.config import settings
from app.database import acquire

logger = logging.getLogger(__name__)

GOOGLE_CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
DEFAULT_EVENT_DURATION = timedelta(hours=2)
EVENT_TIMEZONE = "America/New_York"


def run_async(coro):
    """Helper to run async code in sync Celery task (same pattern as
    app/tasks/scraper_tasks.py)."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _get_google_tokens(user_id: str):
    async with acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT user_id, access_token, refresh_token, token_expiry, scope
            FROM user_google_tokens
            WHERE user_id = $1
            """,
            user_id,
        )


async def _update_access_token(user_id: str, access_token: str, token_expiry: datetime) -> None:
    async with acquire() as conn:
        await conn.execute(
            """
            UPDATE user_google_tokens
            SET access_token = $2, token_expiry = $3, updated_at = NOW()
            WHERE user_id = $1
            """,
            user_id,
            access_token,
            token_expiry,
        )


async def _get_event(event_id: str):
    async with acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT title, description, date_time, end_time,
                   location_name, location_address, external_url
            FROM events
            WHERE id = $1
            """,
            event_id,
        )


def _build_credentials(token_row):
    from google.oauth2.credentials import Credentials

    return Credentials(
        token=token_row["access_token"],
        refresh_token=token_row["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=GOOGLE_CALENDAR_SCOPES,
    )


def _event_body(event_row) -> dict:
    start = event_row["date_time"]
    end = event_row["end_time"] or (start + DEFAULT_EVENT_DURATION)

    description = event_row["description"] or ""
    if event_row["external_url"]:
        description = f"{description}\n\nMore info: {event_row['external_url']}".strip()

    location = event_row["location_address"] or event_row["location_name"] or ""

    return {
        "summary": event_row["title"],
        "description": description,
        "location": location,
        "start": {"dateTime": start.isoformat(), "timeZone": EVENT_TIMEZONE},
        "end": {"dateTime": end.isoformat(), "timeZone": EVENT_TIMEZONE},
    }


async def _sync(user_id: str, event_id: str) -> None:
    token_row = await _get_google_tokens(user_id)
    if token_row is None:
        # User hasn't connected a Google Calendar -- no-op.
        logger.info(f"No Google Calendar connected for user {user_id}; skipping sync")
        return

    credentials = _build_credentials(token_row)

    token_expiry = token_row["token_expiry"]
    if token_expiry is not None and token_expiry <= datetime.now(timezone.utc):
        from google.auth.transport.requests import Request as GoogleAuthRequest

        credentials.refresh(GoogleAuthRequest())
        new_expiry = credentials.expiry
        if new_expiry is not None and new_expiry.tzinfo is None:
            new_expiry = new_expiry.replace(tzinfo=timezone.utc)
        await _update_access_token(user_id, credentials.token, new_expiry)

    event_row = await _get_event(event_id)
    if event_row is None:
        logger.warning(f"Event {event_id} not found; skipping Google Calendar sync for user {user_id}")
        return

    from googleapiclient.discovery import build

    service = build("calendar", "v3", credentials=credentials)
    body = _event_body(event_row)
    service.events().insert(calendarId="primary", body=body).execute()
    logger.info(f"Synced event {event_id} to Google Calendar for user {user_id}")


@celery_app.task(bind=True, name="app.tasks.calendar_tasks.sync_event_to_google_calendar")
def sync_event_to_google_calendar(self, user_id: str, event_id: str):
    """
    Best-effort sync of a godo event into the user's primary Google Calendar.
    No-ops if the user hasn't connected a calendar. Never raises -- a failed
    sync is logged and swallowed so it can't crash the Celery worker or
    surface as an error to the swipe endpoint that triggered it.
    """
    try:
        run_async(_sync(user_id, event_id))
    except Exception as e:
        logger.error(f"Google Calendar sync failed for user={user_id} event={event_id}: {e}")
