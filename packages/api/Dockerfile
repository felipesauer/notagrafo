# syntax=docker/dockerfile:1
# ── Stage 1: deps (com toolchain nativo p/ libxmljs2) ────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/graph/package.json ./packages/graph/
COPY packages/worker/package.json ./packages/worker/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# ── Stage 2: build (compila os dist) ─────────────────────────
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY packages/core ./packages/core
COPY packages/graph ./packages/graph
COPY packages/worker ./packages/worker
COPY packages/api ./packages/api
RUN pnpm --filter @notagrafo/core build \
 && pnpm --filter @notagrafo/graph build \
 && pnpm --filter @notagrafo/worker build \
 && pnpm --filter @notagrafo/api build
# pnpm deploy resolve os workspace deps e traz SÓ produção (sem devDeps),
# com o dist já compilado e o binário nativo do libxmljs2 incluído.
RUN pnpm --filter @notagrafo/api --legacy deploy --prod /out

# ── Stage 3: runtime (enxuto, sem toolchain nem devDeps) ─────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
