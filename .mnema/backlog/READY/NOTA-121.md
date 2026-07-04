---
mnema:
  key: NOTA-121
  state: READY
  title: >-
    Fase 3 — Explorer & tabelas densas: DensityToggle, 1px lines, sticky header,
    peek
  description: >-
    Redesenhar as tabelas do Explorer (pages/explorer/*) com a linguagem densa:
    números quantitativos right-align + tabular-nums; qualitativos left-align;
    linhas 1px cinza-claro (não zebra); sticky header; DensityToggle
    (compacta/padrão/espaçada) no header do Explorer, com estado persistido;
    refinar o peek. Aplicar às entidades Notas/Empresas/Produtos/Impostos.
    Preservar data-testid
    data-table/data-cards/nf-peek/empresa-peek/nf-status-filter; selects e2e
    continuam <select> nativo (ADR-10).
  acceptance_criteria:
    - 'tabelas densas: números right-align+tabular, 1px lines, sticky header'
    - >-
      DensityToggle (3 densidades) no header, estado persistido, aplicado às
      tabelas
    - >-
      peek preservado e navegável; data-testid
      data-table/data-cards/nf-peek/empresa-peek/nf-status-filter intactos
    - specs nf-list/products/companies verdes
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
  updated_at: '2026-07-04T15:45:50.281Z'
---
# Fase 3 — Explorer & tabelas densas: DensityToggle, 1px lines, sticky header, peek
