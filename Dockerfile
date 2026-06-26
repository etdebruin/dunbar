# syntax=docker/dockerfile:1

# ── Build stage: install deps and bundle both apps ──────────────────────────
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app

# Install with a warm dependency cache: lockfile + manifests first.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY packages/cli/package.json packages/cli/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @dunbar/server --filter @dunbar/web build

# ── Runtime stage: just the self-contained bundles ──────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/server/dist/index.js ./server.js
COPY --from=build /app/packages/web/dist/index.js ./web.js
EXPOSE 8080
# Default process is the API; the web app overrides this in fly.web.toml.
CMD ["node", "server.js"]
