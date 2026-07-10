# ── Stage 1: build ───────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# O dashboard depende de @notagrafo/core (util de máscara LGPD compartilhado),
# então o core precisa ser instalado e construído antes do build do dashboard.
COPY packages/core/package.json ./packages/core/
COPY packages/dashboard/package.json ./packages/dashboard/
RUN pnpm install --frozen-lockfile --filter @notagrafo/core --filter @notagrafo/dashboard --ignore-scripts
COPY tsconfig.json tsconfig.build.json ./
COPY packages/core ./packages/core
COPY packages/dashboard ./packages/dashboard
RUN pnpm --filter @notagrafo/core build
RUN pnpm --filter @notagrafo/dashboard build

# ── Stage 2: production (nginx) ──────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/packages/dashboard/dist /usr/share/nginx/html
COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
