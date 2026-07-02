---
mnema:
  key: NOTA-85
  state: DRAFT
  title: 'Fundação: Tailwind v4 + shadcn/ui + design tokens + tipografia'
  description: >-
    Instalar tailwindcss + @tailwindcss/vite + @fontsource-variable/inter no
    dashboard (lockfile commitado — Dockerfile usa --frozen-lockfile; adicionar
    @tailwindcss/oxide a onlyBuiltDependencies na raiz se o pnpm bloquear o
    build script; fallback @tailwindcss/postcss se o plugin recusar peer do Vite
    8). Aliases @/* em tsconfig e vite.config. Criar src/styles/globals.css:
    @custom-variant dark ([data-theme='escuro']) preservando theme.store, tokens
    shadcn + domínio (--status-ativa/cancelada/denegada/inutilizada,
    --export-pending/processing/ready/failed, --chart-1..8) com override dark,
    @theme inline, Inter Variable + tabular-nums. shadcn init (new-york,
    neutral) + add: button input label badge card table dialog sheet
    dropdown-menu tooltip separator skeleton sonner collapsible accordion
    popover progress scroll-area sidebar breadcrumb switch checkbox avatar
    slider. Compat block ~15 linhas no index.css legado (preflight reseta
    headings/botões/inputs das páginas não migradas). Criar src/lib/status.ts
    como fonte única de cores de status NF + export.
  acceptance_criteria:
    - build (tsc+vite), lint e test:unit verdes
    - e2e verdes com compat block (visual legado preservado)
    - Tema claro/escuro alterna via toggle atual (data-theme)
    - >-
      components.json + src/components/ui/* commitados; pnpm-lock.yaml
      atualizado; imagem docker builda
    - Baseline de bundle registrado como observation
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T19:28:39.726Z'
---
# Fundação: Tailwind v4 + shadcn/ui + design tokens + tipografia
