# Deploy BlockForms on a VPS (Docker + Caddy)

This guide runs the full monorepo on one VM: **Postgres**, **API**, **Next.js web**, and **Caddy** as the HTTPS reverse proxy.

## Architecture

```
Internet → Caddy (:443)
             ├─ /trpc, /api, /docs, /health → api:8000
             └─ everything else              → web:3000

postgres:5432 (internal only, not exposed to the internet)
```

The monorepo is built inside Docker images at deploy time. Shared packages (`@repo/database`, `@repo/services`, `@repo/trpc`, etc.) are compiled into the API bundle via `tsup`, and linked into the Next.js build via pnpm workspaces.

## Prerequisites

- A VPS with Docker Engine + Docker Compose v2
- A subdomain (e.g. `blockforms.yourdomain.com`) with an **A record** pointing to the VPS IP
- Ports **80** and **443** open on the firewall

## 1. Clone and configure env

```bash
git clone <your-repo> blockforms
cd blockforms
cp .env.production.example .env.production
nano .env.production   # set DOMAIN, secrets, SMTP, JWT keys
```

Important URL variables (all must use `https://` and the same host):

| Variable              | Example                                  |
| --------------------- | ---------------------------------------- |
| `DOMAIN`              | `blockforms.yourdomain.com`              |
| `APP_BASE_URL`        | `https://blockforms.yourdomain.com`      |
| `BASE_URL`            | `https://blockforms.yourdomain.com`      |
| `CORS_ORIGIN`         | `https://blockforms.yourdomain.com`      |
| `NEXT_PUBLIC_API_URL` | `https://blockforms.yourdomain.com/trpc` |

`NEXT_PUBLIC_API_URL` is baked into the web image at **build time** — change it requires rebuilding the `web` service.

`DATABASE_URL` must use host `postgres` (the Docker service name), not `localhost`.

## 2. Build and start

```bash
chmod +x deploy.sh
./deploy.sh up -d --build
```

(`deploy.sh` always passes `--env-file .env.production`. If you run `docker compose` directly, you must add that flag yourself — otherwise every variable is blank and you will see WARN lines like `The "POSTGRES_USER" variable is not set`.)

On first boot:

1. Postgres starts and becomes healthy
2. `migrate` runs Drizzle migrations and exits
3. API and web start
4. Caddy obtains a Let's Encrypt certificate for `DOMAIN`

## 3. Verify

```bash
./deploy.sh ps
curl -s https://blockforms.yourdomain.com/health
```

Open `https://blockforms.yourdomain.com` in a browser.

## Updating (routine deploy)

From the project root on the VPS:

```bash
cd blockforms          # your clone path
git pull
./deploy.sh up -d --build
```

This rebuilds images that changed, recreates containers, and runs **migrate** before the API starts. Postgres data in the `pg_data` volume is preserved.

Verify:

```bash
./deploy.sh ps
./deploy.sh logs api --tail 50
./deploy.sh logs web --tail 50
curl -s https://blockforms.yourdomain.com/health
```

---

## Rebuild containers

Always use `./deploy.sh` (loads `.env.production`). Never use `docker compose` without `--env-file .env.production`.

### Rebuild everything

```bash
./deploy.sh up -d --build
```

### Stop the stack (keeps the database)

```bash
./deploy.sh down
```

**Do not** use `./deploy.sh down -v` or `docker compose down -v` — that removes volumes, including **`pg_data`**, and wipes the database.

### Rebuild specific services

| Service   | When to use |
| --------- | ----------- |
| `web`     | Frontend / UI changes. Required if `NEXT_PUBLIC_*` env vars changed (compile-time). |
| `api`     | Backend / tRPC changes. |
| `migrate` | Schema migrations only (usually runs automatically on full deploy). |
| `caddy`   | Rare — only if you changed `docker/Caddyfile` or TLS/domain config. |
| `postgres`| No build — data lives in volume `pg_data`. |

**Frontend only** (most common after UI work):

```bash
git pull
./deploy.sh build --no-cache web    # optional: skip --no-cache for faster builds
./deploy.sh up -d web
```

**API only**:

```bash
git pull
./deploy.sh build --no-cache api
./deploy.sh up -d api
```

**Frontend + API** (no migration):

```bash
git pull
./deploy.sh up -d --build web api
```

**Run migrations manually** (after pulling schema changes, without rebuilding everything):

```bash
./deploy.sh run --rm migrate
./deploy.sh up -d api
```

**Caddy** (config change):

```bash
./deploy.sh up -d --force-recreate caddy
```

`postgres` is not rebuilt; restarting it is usually unnecessary:

```bash
./deploy.sh restart postgres
```

---

## Free disk space (Docker build cache)

Build cache and old images can fill the VPS. These commands **do not** delete the database volume if you avoid volume prune.

```bash
# See what Docker is using
docker system df

# Safe: remove build cache only (recommended first)
docker builder prune -af

# Safe: remove unused images (not running containers)
docker image prune -af
```

**Avoid** unless you intend to delete unused volumes (can remove `pg_data` if the stack is down and the volume is orphaned):

```bash
docker volume prune      # risky — can delete DB volume
docker system prune -a --volumes   # never run on production casually
```

### Full rebuild from scratch (keep database)

```bash
./deploy.sh down
docker builder prune -af
docker image prune -af
git pull
./deploy.sh build --no-cache
./deploy.sh up -d --build
```

Confirm the DB volume still exists:

```bash
docker volume ls | grep pg_data
```

---

## Database backup

Backups use the running `postgres` container. Run from the project root.

### One-off SQL dump

```bash
set -a && source .env.production && set +a
./deploy.sh exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  > "backup-$(date +%F-%H%M).sql"
```

Or without sourcing (replace user/db to match `.env.production`):

```bash
./deploy.sh exec -T postgres pg_dump -U blockforms -d blockforms \
  > "backup-$(date +%F-%H%M).sql"
```

`-T` avoids allocating a TTY (better for scripts and redirects).

### Compressed backup

```bash
set -a && source .env.production && set +a
./deploy.sh exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip > "backup-$(date +%F-%H%M).sql.gz"
```

### Copy backup off the VPS

```bash
scp user@your-vps:~/blockforms/backup-2026-05-28-1200.sql ./
```

### Restore from a dump (destructive — overwrites current DB)

Only when you mean to replace data:

```bash
set -a && source .env.production && set +a
./deploy.sh exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < backup-2026-05-28-1200.sql
```

For a clean restore into an empty database, stop the API first, drop/recreate the DB, or restore to a fresh volume — only do this if you know the implications.

---

## Quick reference

```bash
./deploy.sh ps                          # container status
./deploy.sh logs web --tail 100         # frontend logs
./deploy.sh logs api --tail 100         # API logs
./deploy.sh up -d --build web           # rebuild + restart frontend
./deploy.sh up -d --build api           # rebuild + restart API
./deploy.sh up -d --build               # full stack deploy
./deploy.sh down                        # stop (keeps pg_data)
docker builder prune -af                # clear build cache
```

## Local dev vs production

|          | Local               | Production (Docker)      |
| -------- | ------------------- | ------------------------ |
| Web      | `:3000`             | Caddy `:443` → web       |
| API      | `:8000`             | Caddy `/trpc` → api      |
| DB       | `:5432` localhost   | internal `postgres:5432` |
| Env file | `.env` at repo root | `.env.production`        |

Keep using `docker compose.yml` (postgres only) for local development with `pnpm dev`.

## Troubleshooting

**502 on `/trpc` or `/api`** — Caddy cannot reach the API container.

```bash
./deploy.sh ps
./deploy.sh logs api --tail 100
```

Common causes:

- Ran `docker compose` without `--env-file .env.production` (use `./deploy.sh` instead)
- API crashed on startup (missing/invalid env var — check logs for Zod errors)
- `DATABASE_URL` host must be `postgres`, not `localhost`
- Quoted values in `.env.production` (use `DOMAIN=blockforms.example.com`, not `DOMAIN="..."`)
- API not rebuilt after env changes — run `./deploy.sh up -d --build` again

**Caddy can't get a certificate** — DNS must resolve to this server before starting Caddy. Check with `dig blockforms.yourdomain.com`.

**Auth cookies not working** — ensure all URLs use the same `https://DOMAIN` and you're not mixing `www` and bare domain.

**API can't connect to DB** — `DATABASE_URL` host must be `postgres`, matching the compose service name.

**Rebuild web after API URL change** — `NEXT_PUBLIC_*` vars are compile-time. See [Rebuild specific services](#rebuild-specific-services).
