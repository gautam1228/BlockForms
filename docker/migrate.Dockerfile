# One-shot migration runner — uses drizzle-kit from @repo/database.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/database
CMD ["pnpm", "exec", "drizzle-kit", "migrate"]
