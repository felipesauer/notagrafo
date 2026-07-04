---
mnema:
  key: NOTA-120
  state: DRAFT
  title: >-
    Fase 2 — Home/Overview: bento + KPIs + Insights panel (dados reais) + Bar
    List
  description: >-
    Redesenhar a Home (pages/Overview.tsx, agora em /): bento 12-col. Linha hero
    com 4 KPI cards (sparkline+delta, evoluir KpiCard). Blocos: volume
    ComposedChart (8col), donut tributário (4col), ranking fornecedores como Bar
    List reutilizável com drill-through <Link search> (5col), distribuição por
    UF em barras (7col), últimas NFs (12col). Popular o Insights panel com
    regras SIMPLES sobre a API existente (última NF processada, variação de
    carga tributária vs período anterior, concentração do top fornecedor, jobs
    recentes) — sem IA/novo backend. Consolidar UfBars/FornecedorBars num
    componente BarList. Preservar data-testid kpi-card, chart, data-table.
  acceptance_criteria:
    - >-
      Home em / com bento grid, 4 KPIs com sparkline+delta, donut, Bar List, UF
      bars, últimas NFs
    - >-
      Insights panel populado com cards derivados de dados reais da API (sem
      placeholder)
    - drill-through dos rankings/UF leva ao /explorar filtrado
    - >-
      data-testid kpi-card/chart/data-table preservados; overview.spec
      atualizado e verde
    - typecheck/lint verdes
  labels:
    - dashboard
    - dataviz
    - overview
    - redesign
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:44.188Z'
---
# Fase 2 — Home/Overview: bento + KPIs + Insights panel (dados reais) + Bar List
