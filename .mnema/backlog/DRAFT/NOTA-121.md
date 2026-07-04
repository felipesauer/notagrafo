---
mnema:
  key: NOTA-121
  state: DRAFT
  title: >-
    Fase 3 — Explorer & tabelas densas: DensityToggle, 1px lines, sticky header,
    peek
  description: >-
    Redesenhar o Explorer (pages/explorer/*) com a nova pele: tabelas densas
    (números quantitativos right-align + tabular-nums; qualitativos left-align;
    linhas 1px cinza-claro em vez de zebra; sticky header), novo DensityToggle
    (compacta/padrão/espaçada), FilterBar unificado com chips e filtro ativo
    removível, e peek lateral (Sheet) navegável por ↑/↓. Aplicar às entidades
    Notas/Empresas/Produtos/Impostos. Preservar data-testid data-table,
    data-cards, nf-peek, empresa-peek, nf-status-filter; selects manipulados por
    e2e continuam <select> nativo (ADR-10).
  acceptance_criteria:
    - tabelas densas com números right-align+tabular, 1px lines, sticky header
    - DensityToggle funcional (3 densidades) e FilterBar com chips/filtro ativo
    - peek navegável por ↑/↓ preservado nas entidades
    - >-
      data-testid data-table/data-cards/nf-peek/empresa-peek/nf-status-filter
      preservados; specs list/products/companies verdes
    - typecheck/lint verdes
  labels:
    - dashboard
    - explorer
    - redesign
    - tables
  estimate: 5
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:45.973Z'
---
# Fase 3 — Explorer & tabelas densas: DensityToggle, 1px lines, sticky header, peek
