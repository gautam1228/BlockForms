# BlockForms

Craft forms, block by block. BlockForms is a Typeform-style form builder with a Minecraft-inspired UI — design dynamic forms, publish shareable links, and collect responses.

## Features

- Visual form builder with drag-and-order fields and draft sync
- Public forms at `/f/[id]` with biome themes (Overworld, Caves, Nether, The End)
- Auth (sign up, login, email verification, password reset)
- Form visibility, password protection, and login-required submissions
- Response export and featured public forms gallery
- Background music, click SFX, and themed landing page

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 16, React, Tailwind, tRPC client |
| Backend | Express, tRPC, OpenAPI (`/docs`) |
| Database | PostgreSQL, Drizzle ORM |
| Monorepo | pnpm workspaces, Turborepo |

## Project structure

```
apps/
  web/          Next.js frontend (port 3000)
  api/          Express + tRPC API (port 8000)
packages/
  database/     Drizzle schema and migrations
  services/     Business logic (forms, auth, submissions)
  trpc/         Shared tRPC router and client
  logger/       Logging
  eslint-config/
  typescript-config/
```

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 (`corepack enable && corepack prepare pnpm@9.0.0 --activate`)
- **Docker** (for local Postgres only)

## Local development

### 1. Clone and install

```bash
git clone <repo-url> blockforms
cd blockforms
pnpm install
```

### 2. Environment variables

Create a `.env` file at the repo root (used by all apps via `dotenv`):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dev

HASHING_ALGORITHM=sha256
JWT_ACCESS_SECRET=your-local-access-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your-local-refresh-secret
JWT_REFRESH_EXPIRES=7d

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=your-smtp-password
SENDER_EMAIL=noreply@example.com

APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/trpc
BASE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
```

Optional: run `./setup.sh` to symlink the root `.env` into each app/package directory.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres on **5432** with user `postgres`, password `postgres`, database `dev`.

### 4. Run migrations

```bash
pnpm db:migrate
```

Generate new migrations after schema changes:

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start dev servers

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| tRPC | http://localhost:8000/trpc |
| API docs | http://localhost:8000/docs |

### Demo credentials (For Hackathon)

| Field | Value |
|-------|--------|
| Email | `gautamsingh12122003@gmail.com` |
| Password | `Gautam@1234` |

## Scripts

```bash
pnpm dev           # Web + API (via Turbo)
pnpm build         # Production build
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm check-types   # TypeScript
pnpm db:migrate    # Apply migrations
pnpm db:generate   # Generate migration from schema changes
```

## Production deployment

For VPS deployment with Docker Compose, Caddy (HTTPS), and a subdomain, see **[deploy/README.md](./deploy/README.md)**.

Copy `.env.production.example` to `.env.production`, fill in your domain and secrets, then:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
