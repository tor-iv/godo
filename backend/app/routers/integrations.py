"""
Optional "Connect Google Calendar" integration.

Additive only -- this does NOT touch or replace the existing email/password
JWT login flow in app/routers/auth.py. A user must already be authenticated
via that flow before they can connect (or disconnect) a Google Calendar.

OAuth flow (mobile-app friendly):
  1. App calls GET /api/v1/integrations/google/connect with the user's normal
     Bearer JWT. We return {"authorization_url": "..."} for the app to open
     in an in-app browser / system browser (not a server-side redirect,
     since this is consumed by a React Native client rather than a web page).
  2. User completes Google's consent screen. Google redirects the browser to
     our public GET /api/v1/integrations/google/callback?code=...&state=...
  3. We verify `state` (a short-lived signed JWT minted in step 1 -- reusing
     the existing JWT auth mechanism rather than inventing a new signing
     scheme) to recover the user_id, exchange `code` for tokens, and persist
     them. We then redirect to a custom URL scheme deep link
     (godo://calendar-connected) that the mobile app intercepts to show a
     success/failure screen.

NOTE on refresh token longevity: while the Google OAuth consent screen for
this app is in "Testing" publishing status, Google expires refresh tokens
issued to it after 7 days of inactivity/unverified-app status. That's fine
for personal/dev use, but means a connected user will periodically need to
reconnect until the OAuth consent screen is moved to "In production" /
verified in Google Cloud Console. That's an operator-side console
configuration step, not something this code works around.
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import RedirectResponse

from app.database import acquire
from app.config import settings
from app.middleware.auth import get_auth_middleware, AuthMiddleware
from app.utils.exceptions import APIException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations/google", tags=["Integrations"])

# Calendar-only scope -- we only need to create events, not read free/busy
# data (free/busy conflict-checking is explicitly out of scope).
GOOGLE_CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

# Short lifetime for the OAuth `state` param -- it only needs to survive the
# round trip through Google's consent screen.
OAUTH_STATE_EXPIRE_MINUTES = 10

# Deep link the mobile app registers and intercepts to know the OAuth flow
# finished (success or failure communicated via the `status` query param).
MOBILE_DEEP_LINK = "godo://calendar-connected"


def _build_flow():
    """Construct a google_auth_oauthlib Flow from app settings."""
    # Deferred import: this router is included directly by app.main, so a
    # missing/broken google-auth-oauthlib install must not prevent the whole
    # app from starting -- this is an OPTIONAL feature.
    from google_auth_oauthlib.flow import Flow

    if not (settings.google_client_id and settings.google_client_secret and settings.google_redirect_uri):
        raise APIException(
            message="Google Calendar integration is not configured",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="GOOGLE_INTEGRATION_NOT_CONFIGURED",
        )
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=GOOGLE_CALENDAR_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )


@router.get("/connect")
async def connect_google_calendar(
    current_user=Depends(get_auth_middleware().get_current_user),
    auth: AuthMiddleware = Depends(get_auth_middleware),
):
    """
    Build a Google OAuth2 authorization URL for the current user to connect
    their Google Calendar. Returns the URL as JSON for the mobile app to open
    in an in-app browser (rather than a server-side redirect).
    """
    # Sign a short-lived state token binding this auth attempt to the
    # current user, so the public callback endpoint can't be abused to
    # attach a Google account's tokens to an arbitrary user_id. Reuses the
    # existing JWT mechanism rather than a bespoke signing scheme.
    state_token = auth.create_access_token(
        data={"user_id": str(current_user.id), "purpose": "google_oauth_state"},
        expires_delta=timedelta(minutes=OAUTH_STATE_EXPIRE_MINUTES),
    )

    flow = _build_flow()
    authorization_url, _ = flow.authorization_url(
        access_type="offline",  # required to receive a refresh_token
        prompt="consent",  # forces Google to re-issue a refresh_token even on reconnect
        include_granted_scopes="true",
        state=state_token,
    )

    return {"authorization_url": authorization_url}


@router.get("/callback")
async def google_calendar_callback(
    code: str = Query(...),
    state: str = Query(...),
    auth: AuthMiddleware = Depends(get_auth_middleware),
):
    """
    Public endpoint -- Google redirects here after user consent. No
    Authorization header is present (the browser/webview that hits this URL
    is not the API client), so the user is identified solely via the signed
    `state` param minted in /connect.
    """
    try:
        payload = auth.verify_token(state)
    except APIException:
        return RedirectResponse(url=f"{MOBILE_DEEP_LINK}?status=error&reason=invalid_state")

    if payload.get("purpose") != "google_oauth_state":
        return RedirectResponse(url=f"{MOBILE_DEEP_LINK}?status=error&reason=invalid_state")

    user_id = payload.get("user_id")
    if not user_id:
        return RedirectResponse(url=f"{MOBILE_DEEP_LINK}?status=error&reason=invalid_state")

    try:
        flow = _build_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials

        expiry = credentials.expiry
        if expiry is not None and expiry.tzinfo is None:
            from datetime import timezone
            expiry = expiry.replace(tzinfo=timezone.utc)

        scope = " ".join(credentials.scopes) if credentials.scopes else " ".join(GOOGLE_CALENDAR_SCOPES)

        async with acquire() as conn:
            await conn.execute(
                """
                INSERT INTO user_google_tokens
                    (user_id, access_token, refresh_token, token_expiry, scope, created_at, updated_at)
                VALUES
                    ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    access_token = EXCLUDED.access_token,
                    -- Google only returns a refresh_token on the FIRST consent grant; a
                    -- reconnect may omit it. Never clobber an existing refresh_token with NULL.
                    refresh_token = COALESCE(EXCLUDED.refresh_token, user_google_tokens.refresh_token),
                    token_expiry = EXCLUDED.token_expiry,
                    scope = EXCLUDED.scope,
                    updated_at = NOW()
                """,
                user_id,
                credentials.token,
                credentials.refresh_token,
                expiry,
                scope,
            )

        logger.info(f"Connected Google Calendar for user {user_id}")
        return RedirectResponse(url=f"{MOBILE_DEEP_LINK}?status=success")

    except Exception as e:
        logger.error(f"Google Calendar OAuth callback failed for user {user_id}: {e}")
        return RedirectResponse(url=f"{MOBILE_DEEP_LINK}?status=error&reason=token_exchange_failed")


@router.delete("/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_google_calendar(
    current_user=Depends(get_auth_middleware().get_current_user),
):
    """Disconnect the current user's Google Calendar (deletes stored tokens)."""
    async with acquire() as conn:
        await conn.execute(
            "DELETE FROM user_google_tokens WHERE user_id = $1",
            current_user.id,
        )
    return None
