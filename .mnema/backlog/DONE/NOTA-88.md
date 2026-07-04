---
mnema:
  key: NOTA-88
  state: DONE
  title: Página Visão Geral
  description: >-
    Redesign da Overview: 4 KPI cards com ícone lucide e números tabulares; 3
    charts tokenizados (ComposedChart volume, BarChart horizontal top
    fornecedores, Treemap UF com --chart-* e stroke var(--background)); tabela
    últimas NFs com links para detalhe; skeletons fiéis por seção; empty state
    do Treemap com ação Enviar NFe. Usa PageHeader, ChartCard/ChartTooltip,
    palette, LoadingSkeleton variantes e Card do shadcn. Remove do index.css as
    classes .kpis-grid/.kpi-card/.chart/.table-section que só a Overview usa
    (Taxes ainda usa kpis-grid/kpi-card/chart — manter até T9).
  acceptance_criteria:
    - 4 KPIs com ícones e tabular-nums (testid kpi-card preservado)
    - 3 charts com paleta --chart-* corretos em claro/escuro
    - Skeleton/empty por seção
    - e2e overview verde
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:58:46.678Z'
---
# Página Visão Geral
