---
mnema:
  key: NOTA-126
  state: DRAFT
  title: >-
    BUG: crash da Rede completa no dev (Vite 8 corrompe método import() do
    graphology)
  description: >-
    Em /explorar?entity=rede (dev server), a aba/tela crasha com 'Something went
    wrong! Unexpected token '(''. Causa raiz (subagente): bug do transform de
    dev do Vite 8 (import-analysis/HMR) que confunde o MÉTODO de classe
    `import(data, merge)` da lib graphology (embutida no reagraph) com um
    import() dinâmico e injeta __vite__injectQuery, corrompendo a assinatura
    para `import(__vite__injectQuery(data,'import'), merge) {` → SyntaxError. Só
    quebra no DEV; o build (Rolldown/nginx) não faz esse rewrite (0 ocorrências
    de __vite__injectQuery no dist), por isso funciona em produção. NÃO é dist
    stale do @notagrafo/graph nem oklch/WebGL (red herrings). Evidência: node
    --check no reagraph.js servido falha na linha corrompida; em disco passa.
    Correção: (1 preferida) bump do vite em packages/dashboard além do ^8.1.0
    até patch que corrige a detecção de import(); ou (2 paliativo)
    optimizeDeps:{exclude:['reagraph']} no vite.config.ts (testar — arrasta
    three/graphology como ESM cru).
  acceptance_criteria: []
  labels:
    - area:dashboard
    - sev:alta
    - tipo:bug
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:28.437Z'
---
# BUG: crash da Rede completa no dev (Vite 8 corrompe método import() do graphology)
