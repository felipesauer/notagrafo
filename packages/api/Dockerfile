# syntax=docker/dockerfile:1
# ── Stage 1: deps (com toolchain nativo p/ libxmljs2) ────────
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/graph/package.json ./packages/graph/
COPY packages/worker/package.json ./packages/worker/
COPY packages/api/package.json ./packages/api/
# cache mount do store pnpm: pacotes baixados persistem entre builds (install e
# o `pnpm deploy` reusam em vez de rebaixar tudo).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: build (compila os dist) ─────────────────────────
# Camadas em ordem de estabilidade: as libs (core/graph/worker) mudam pouco e
# são compiladas ANTES do api. Assim, mudar só o código do api NÃO invalida a
# camada de build das libs — o rebuild incremental recompila apenas o api.
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY packages/core ./packages/core
COPY packages/graph ./packages/graph
COPY packages/worker ./packages/worker
RUN pnpm --filter @notagrafo/core build \
 && pnpm --filter @notagrafo/graph build \
 && pnpm --filter @notagrafo/worker build
COPY packages/api ./packages/api
RUN pnpm --filter @notagrafo/api build
# pnpm deploy resolve os workspace deps e traz SÓ produção (sem devDeps),
# com o dist já compilado e o binário nativo do libxmljs2 incluído. O cache
# mount do store evita re-resolver/rebaixar os ~660 pacotes a cada rebuild.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @notagrafo/api --legacy deploy --prod /out

# ── Stage 3: runtime (enxuto, sem toolchain nem devDeps) ─────
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
