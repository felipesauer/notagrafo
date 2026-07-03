---
mnema:
  key: NOTA-87
  state: DONE
  title: 'Primitivos de página: shared components, ChartCard e hooks (debounce, sort)'
  description: >-
    Refatorar src/components/shared.tsx: NFStatusBadge via lib/status.ts +
    variantes de Badge; CopyableKey com ícones Copy/Check + toast; EmptyState
    com slot de ação; LoadingSkeleton com variantes fiéis (tabela N colunas,
    grid KPIs, card); InlineError com Button. Criar
    src/components/charts/ChartCard.tsx + ChartTooltip.tsx + palette.ts (lê
    --chart-*; Recharts v3 direto — NOTA-ADR-8), src/components/PageHeader.tsx
    (h2 + descrição + ações), src/hooks/useDebouncedValue.ts e
    src/hooks/useTableSort.ts (com aria-sort).
  acceptance_criteria:
    - shared.tsx sem cores hard-coded (consome lib/status.ts)
    - ChartCard/ChartTooltip com var(--chart-*) funcionando em claro/escuro
    - useDebouncedValue e useTableSort com testes unitários
    - e2e verdes
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:58:44.324Z'
---
# Primitivos de página: shared components, ChartCard e hooks (debounce, sort)
