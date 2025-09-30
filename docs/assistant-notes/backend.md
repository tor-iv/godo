# Backend Notes

## Architecture
- FastAPI application defined in `app/main.py`; wires lifespan events, CORS, request timing middleware, and exception handlers.
- Routers mounted under `/api/v1` (see `app/routers/__init__.py`). Current modules: `auth.py` (registration, login, refresh, logout), `users.py` (profile endpoints).
- Business logic lives in `app/services/*`; data access uses SQLAlchemy models plus Supabase integration for auth and storage.

## Configuration & Environment
- Settings handled by `app/config.py` (`pydantic-settings`). Critical env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, Redis config, optional API keys.
- Neighborhoods, event categories, and transit score constants pre-defined for validation/ML heuristics.
- Local `.env` expected in `backend/` (not committed). Use `python-dotenv` support.

## Data Layer
- `app/database.py` manages async SQLAlchemy engine and Supabase client. Health checks executed on startup.
- Models & schemas split between SQLAlchemy ORM definitions (`app/models/db`) and Pydantic response/request models (`app/models/user.py`, etc.).
- Background jobs configured via `celery.py` with Redis broker/result backend; integrate when enabling async tasks like email or ML scoring.

## Security & Auth
- Custom `AuthMiddleware` (JWT helper) issues access and refresh tokens; tokens stored with expiration defined in settings.
- Login endpoint expects OAuth2 password form; register uses JSON body.
- RLS enforced in Supabase via SQL migrations (`002_rls_policies.sql`); backend should align with those policies when performing direct Supabase operations.

## Running Locally
- Install deps: `pip install -r requirements.txt` (consider using virtualenv).
- Start API: `uvicorn app.main:app --reload` from `backend/` directory.
- Optional services: Redis (for Celery), Postgres/Supabase; Docker (`docker-compose.yml`) orchestrates API + services.
- Tests: `pytest`; lint/format with `black`, `isort`, `mypy` as needed.

## Integration Points
- Frontend hits `/api/v1` endpoints defined here; maintain parity with `godo-app/src/config/api.ts` routes when adding or renaming endpoints.
- Supabase functions plus migrations in `backend/database/migrations`; run them against Supabase instance before using API.
- Celery tasks can be triggered via FastAPI endpoints or scheduled jobs; update `scripts/` to reflect new tasks.
