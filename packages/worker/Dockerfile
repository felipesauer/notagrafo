# syntax=docker/dockerfile:1
# Espelho do Dockerfile da API — entrypoint é o worker.

# ── Stage 1: deps (com toolchain nativo p/ libxmljs2) ────────
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/graph/package.json ./packages/graph/
COPY packages/worker/package.json ./packages/worker/
# cache mount do store pnpm (ver Dockerfile da api).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: build (compila os dist) ─────────────────────────
# Libs (core/graph) primeiro; worker por último. Mudar só o código do worker
# não invalida a camada de build das libs (rebuild incremental mais rápido).
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY packages/core ./packages/core
COPY packages/graph ./packages/graph
RUN pnpm --filter @notagrafo/core build \
 && pnpm --filter @notagrafo/graph build
COPY packages/worker ./packages/worker
RUN pnpm --filter @notagrafo/worker build
# pnpm deploy: só produção (sem devDeps) + dist + binário nativo do libxmljs2.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @notagrafo/worker --legacy deploy --prod /out

# ── Stage 3: runtime (enxuto, sem toolchain nem devDeps) ─────
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
CMD ["node", "dist/worker.js"]
