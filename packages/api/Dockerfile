# ── Stage 1: deps ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
# build tools para compilar libxmljs2 (binário nativo)
RUN apk add --no-cache python3 make g++ && corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/graph/package.json ./packages/graph/
COPY packages/worker/package.json ./packages/worker/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ───────────────────────────────────────────
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY packages/core ./packages/core
COPY packages/graph ./packages/graph
COPY packages/worker ./packages/worker
COPY packages/api ./packages/api
RUN pnpm --filter @notagrafo/core build
RUN pnpm --filter @notagrafo/graph build
RUN pnpm --filter @notagrafo/worker build
RUN pnpm --filter @notagrafo/api build

# ── Stage 3: production ──────────────────────────────────────
# Copia o workspace já construído do stage build (node_modules com o binário
# libxmljs2 compilado + os dist). Mais rápido e evita recompilar nativo.
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["node", "packages/api/dist/server.js"]
