# API — bundles workspace @repo/* packages via tsup (see apps/api/tsup.config.ts)
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@repo/api
# Pruned prod node_modules with correct symlinks (root node_modules alone breaks pnpm resolution)
RUN pnpm deploy --filter=@repo/api --prod /prod/api

FROM base AS runner
ENV NODE_ENV=prod
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs api

COPY --from=builder /prod/api ./

USER api
EXPOSE 8000
CMD ["node", "dist/index.js"]
