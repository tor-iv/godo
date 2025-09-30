# GoDo Repository Reference

## Monorepo Layout
- `godo-app/`: Expo React Native client (TypeScript) targeting mobile and web.
- `backend/`: FastAPI service with Supabase/Postgres integration, Celery tasks, and Redis support.
- `docs/`: Product and implementation guides plus design specs.
- `database/`, `backend/database/`: SQL schema and migration assets for Supabase.
- `scripts/`, `tests/`, `plans/`, `memory/`: automation, QA, planning, and session history helpers.

## Frontend (godo-app)
- Stack: Expo (~53), React Native 0.79, React 19, TypeScript 5.8.
- Structure: `src/components` (UI blocks grouped by feature), `src/screens` (discover, calendar, profile, events), `src/navigation` (stack/tab navigators), `src/services` (API + Swipe trackers), `src/config` (Supabase + REST endpoints), `src/utils`, and `src/types`.
- API access via `src/services/ApiService.ts` hit `API_CONFIG` endpoints (REST on `/api/v1/...`).
- Local auth tokens stored in AsyncStorage. Supabase client config defined in `src/config/supabase.ts` using `.env` values (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Testing commands provided through custom runner (`npm test`, specific Jest suites under `tests/`). Type checking and linting via `npm run typecheck`, `npm run lint`.
- Common commands: `npm install`, `npm run start` (Expo dev server), `npm run android/ios/web` for platform targets.

## Backend (backend)
- Stack: FastAPI 0.104, Uvicorn, SQLAlchemy, Supabase client, asyncpg, Celery 5 (Redis broker), Sentry, scikit-learn for future ML.
- Entry point `app/main.py` registers routers under `/api/v1` (auth, users, events, swipes), CORS for Expo, startup health checks, custom exception handlers.
- Key packages:
  - `app/routers/`: FastAPI routers (`auth.py`, `users.py`).
  - `app/services/`: business logic (user service, auth tokens, event service, swipe handling).
  - `app/models/`: Pydantic schemas and ORM models.
  - `app/database.py`: connection management; ties into Supabase/Postgres.
  - `app/middleware/`: auth & logging helpers.
  - `celery.py`: background worker setup.
- Run locally with `uvicorn app.main:app --reload` in `backend/` (ensure env vars for Supabase and database are configured).
- Python tooling: `poetry` not used; install with `pip install -r requirements.txt`. Test via `pytest`.

## Database & Data Layer
- Supabase/Postgres schema defined in `backend/database/migrations/001_initial_schema.sql`; includes enums for privacy, events, swipes, attendance, groups, notifications, and tables (`users`, `events`, `swipes`, `event_attendance`, `friendships`, etc.).
- Additional migration scripts for row-level security (`002_rls_policies.sql`) and indexes (`003_indexes.sql`).
- `docs/database/database.sql` mirrors consolidated schema for documentation.

## Configuration & Secrets
- Frontend `.env` (Expo) contains Supabase anon + service keys. Treat as sensitive.
- Backend expects environment variables (see `backend/app/config.py` and `.env` patterns in docs) for Supabase credentials, JWT settings, Redis, Sentry.
- `.gitignore` already excludes typical secrets; double-check before committing new env files.

## Helpful Documentation
- Product/design context in `docs/*.md` (e.g., `GODO_APP_STRUCTURE_REVIEW.md`, `PROFILE_UI_IMPLEMENTATION.md`).
- Deployment notes in `DEPLOYMENT.md`, `DEPLOYMENT_STRATEGY.md`, Docker guidance in `DOCKER_README.md`.
- Day-one setup instructions in `day-1-setup-guide.md` and `LOCAL_DEV_README.md`.

## Next Steps for Deep Dives
- Create focused notes (frontend architecture, backend auth, swipe system) in this `docs/assistant-notes/` directory as needed.
- When implementing features, cross-reference corresponding plan docs under `plans/` and design specs in `docs/`.
