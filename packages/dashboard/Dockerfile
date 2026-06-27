# ── Stage 1: build ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/dashboard/package.json ./packages/dashboard/
RUN pnpm install --frozen-lockfile --filter @notagrafo/dashboard --ignore-scripts
COPY packages/dashboard ./packages/dashboard
RUN pnpm --filter @notagrafo/dashboard build

# ── Stage 2: production (nginx) ──────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/packages/dashboard/dist /usr/share/nginx/html
COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
