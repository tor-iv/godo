# Deployment Runbook -- Hetzner (178.156.205.42)

The godo backend (API + Celery worker/beat + Postgres/PostGIS + Redis, fronted
by Caddy) runs as a Docker Compose stack at `/opt/godo/backend` on a dedicated
Hetzner Cloud box. No custom domain yet -- TLS is via Caddy's automatic
sslip.io support, reachable at `https://178.156.205.42.sslip.io`.

The frontend (`godo-app/`, Expo) is not part of this stack and is not deployed
here.

---

## Prerequisites

- Hetzner Cloud server already provisioned: `178.156.205.42`, Ubuntu 24.04,
  Docker Engine + compose plugin installed via `cloud-init.yml`.
- SSH access as root using `~/.ssh/godo_deploy`.
- GitHub repo with this code; Actions enabled.

---

## 1. Confirm the server is ready

```sh
ssh -i ~/.ssh/godo_deploy root@178.156.205.42
docker --version   # should print Docker version 26+
mkdir -p /opt/godo
```

(`cloud-init.yml` already creates `/opt/godo`, but this is harmless if re-run.)

---

## 2. First clone + `.env`

```sh
ssh -i ~/.ssh/godo_deploy root@178.156.205.42

git clone https://github.com/<YOUR_ORG>/godo.git /opt/godo
cd /opt/godo/backend

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

cat > .env <<EOF
POSTGRES_USER=godo
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=godo

JWT_SECRET=$JWT_SECRET

DEEPSEEK_API_KEY=
TICKETMASTER_API_KEY=
NYC_OPEN_DATA_API_KEY=

# Placeholders for features other engineers are building in parallel --
# safe to leave blank until those land.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
EOF

chmod 600 .env
```

Where to get keys:
- `DEEPSEEK_API_KEY` -- platform.deepseek.com (API Keys).
- `TICKETMASTER_API_KEY` -- developer.ticketmaster.com (Discovery API app key).
- `NYC_OPEN_DATA_API_KEY` -- data.cityofnewyork.us (account -> Manage -> Create App Token).

`POSTGRES_USER`/`POSTGRES_DB` above (`godo`/`godo`) are placeholders -- pick
whatever you like, just keep them consistent in `.env`; `docker-compose.yml`
reads everything from these vars, nothing is hardcoded elsewhere.

---

## 3. First deploy

```sh
cd /opt/godo/backend
docker compose up -d --build
```

Order of operations the compose file enforces:
1. `postgres` (postgis/postgis:16-3.4) starts and waits for `pg_isready`.
2. `migrate` (one-shot) applies `database/selfhost/001_schema.sql` then
   `002_indexes.sql` once `postgres` is healthy, then exits 0. It's safe to
   re-run on later deploys -- it checks whether the schema already exists
   (`to_regclass('public.users')`) and skips re-applying if so.
3. `api`, `celery-worker`, `celery-beat` start once `migrate` has completed
   successfully and `redis` is healthy.
4. `caddy` starts, reverse-proxying `178.156.205.42.sslip.io` to `api:8000`,
   and requests its TLS cert automatically on first hit.

---

## 4. Set GitHub Actions secrets

In **Settings -> Secrets and variables -> Actions** add:

| Secret | Value |
|---|---|
| `HETZNER_IP` | `178.156.205.42` |
| `SSH_PRIVATE_KEY` | Private half of `~/.ssh/godo_deploy` (public half is in the server's `authorized_keys`) |
| `SSH_HOST_FINGERPRINT` | `ssh-keyscan 178.156.205.42 \| ssh-keygen -lf -` |

After this, every push to `main` runs `.github/workflows/deploy-godo.yml`,
which SSHes in, `git pull`s, `docker compose up -d --build`, and restarts
Caddy (its Caddyfile is bind-mounted, so a plain `up -d` won't pick up edits
to it -- certs persist in the `caddy_data` volume, so the restart doesn't
re-trigger ACME).

---

## 5. Verify

```sh
ssh -i ~/.ssh/godo_deploy root@178.156.205.42
cd /opt/godo/backend
docker compose ps                 # all services should show "running" (migrate: "exited (0)")
curl https://178.156.205.42.sslip.io/health
```

`/health` returns `{"status": ..., "version": ..., "timestamp": ..., "services": {...}}`
from `db_manager.health_check()` -- confirm `status` is `healthy`.

---

## Useful commands

```sh
# View logs
docker compose logs -f api
docker compose logs -f celery-worker
docker compose logs -f caddy

# Restart a single service
docker compose restart api

# Open a psql shell
docker compose exec postgres psql -U godo -d godo

# Force rebuild after a dependency change
docker compose up -d --build

# Prune old images
docker image prune -f
```

---

## Notes / open items

- `backend/Procfile`, `backend/railway.json`, `backend/railway.toml` are left
  in place for now (Railway is being phased out) -- a later cleanup pass will
  remove them once this Hetzner deploy is verified working.
- `backend/Dockerfile` installs Playwright's Chromium OS-level dependencies
  unconditionally (the scraper pipeline drives headless Chromium), but
  `playwright` itself is not yet in `requirements.txt` -- that pip dependency
  and the `playwright install chromium` browser-binary step are owned by the
  team migrating the scraper data-access layer in parallel.
- The root `docker-compose.yml` (Expo dev container + local Supabase stack)
  and the local dev `bun run dev`/`services:up`/`backend:up` scripts are
  unrelated to this deploy and were left untouched -- they're for local
  frontend+backend development, not the Hetzner production stack.
