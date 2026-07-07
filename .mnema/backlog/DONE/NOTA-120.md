---
mnema:
  key: NOTA-120
  state: DONE
  title: >-
    Fase 2 — Home/Overview: bento + KPIs + Insights panel (dados reais) + Bar
    List
  description: >-
    Refinar a Home (pages/Overview.tsx, em /): bento 12-col, 4 KPI cards com
    sparkline+delta (evoluir KpiCard), volume ComposedChart, donut tributário,
    ranking fornecedores como Bar List reutilizável com drill-through,
    distribuição por UF, últimas NFs. Popular o InsightsPanel com regras SIMPLES
    sobre a API existente (overview/volume/top-empresas/tax): última NF
    processada, variação de carga tributária vs período anterior, concentração
    do top fornecedor, ingestão recente. Sem IA/novo backend. Consolidar
    UfBars/FornecedorBars num BarList. Preservar data-testid kpi-card, chart,
    data-table.
  acceptance_criteria:
    - >-
      Home em / com bento, 4 KPIs sparkline+delta, donut, Bar List, UF bars,
      últimas NFs
    - >-
      InsightsPanel populado com cards derivados de dados reais da API (sem
      placeholder)
    - drill-through dos rankings/UF leva ao /explorar filtrado
    - data-testid kpi-card/chart/data-table preservados; overview.spec verde
    - typecheck/lint verdes
  labels:
    - dashboard
    - dataviz
    - overview
    - redesign
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:56:53.316Z'
---
# Fase 2 — Home/Overview: bento + KPIs + Insights panel (dados reais) + Bar List
