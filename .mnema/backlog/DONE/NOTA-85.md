---
mnema:
  key: NOTA-85
  state: DONE
  title: 'Fundação: Tailwind v4 + shadcn/ui + design tokens + tipografia'
  description: >-
    Instalar tailwindcss + @tailwindcss/vite + @fontsource-variable/inter no
    dashboard (lockfile commitado — Dockerfile usa --frozen-lockfile; adicionar
    @tailwindcss/oxide a onlyBuiltDependencies na raiz se o pnpm bloquear o
    build script; fallback @tailwindcss/postcss se o plugin recusar peer do Vite
    8). Aliases @/* em tsconfig e vite.config. Criar src/styles/globals.css:
    @custom-variant dark ([data-theme='escuro']) preservando theme.store, tokens
    shadcn + domínio (--status-*, --export-*, --chart-1..8) com override dark,
    @theme inline, Inter Variable + tabular-nums. shadcn (new-york, neutral) +
    add de ~22 primitivos. Compat block no index.css legado. Criar
    src/lib/status.ts como fonte única de cores de status NF + export.
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
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:58:40.581Z'
---
# Fundação: Tailwind v4 + shadcn/ui + design tokens + tipografia
