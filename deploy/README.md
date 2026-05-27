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
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

On first boot:

1. Postgres starts and becomes healthy
2. `migrate` runs Drizzle migrations and exits
3. API and web start
4. Caddy obtains a Let's Encrypt certificate for `DOMAIN`

## 3. Verify

```bash
docker compose -f docker-compose.prod.yml ps
curl -s https://blockforms.yourdomain.com/health
```

Open `https://blockforms.yourdomain.com` in a browser.

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Migrations run automatically on each deploy (the `migrate` service).

## Local dev vs production

|          | Local               | Production (Docker)      |
| -------- | ------------------- | ------------------------ |
| Web      | `:3000`             | Caddy `:443` → web       |
| API      | `:8000`             | Caddy `/trpc` → api      |
| DB       | `:5432` localhost   | internal `postgres:5432` |
| Env file | `.env` at repo root | `.env.production`        |

Keep using `docker compose.yml` (postgres only) for local development with `pnpm dev`.

## Troubleshooting

**Caddy can't get a certificate** — DNS must resolve to this server before starting Caddy. Check with `dig blockforms.yourdomain.com`.

**Auth cookies not working** — ensure all URLs use the same `https://DOMAIN` and you're not mixing `www` and bare domain.

**API can't connect to DB** — `DATABASE_URL` host must be `postgres`, matching the compose service name.

**Rebuild web after API URL change** — `NEXT_PUBLIC_*` vars are compile-time:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build web
docker compose -f docker-compose.prod.yml --env-file .env.production up -d web
```
