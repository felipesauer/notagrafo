---
mnema:
  key: NOTA-178
  state: IN_REVIEW
  title: Comparação de períodos (mês vs anterior / YoY) nos KPIs
  description: >-
    getPeriodComparison no graph (atual/previous/yearAgo + variações) +
    /stats/comparativo. KPIs da Overview usam a variação real dos últimos 30d vs
    os 30 anteriores. Nomes em inglês. Testes unit da lógica de janelas de data.
  acceptance_criteria:
    - API retorna atual + anterior + YoY com variações
    - KPIs exibem variação vs comparativo
    - Testes das janelas de data
    - Verificado E2E
  labels:
    - analise
    - api
    - bi
    - dashboard
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T17:56:59.413Z'
---
# Comparação de períodos (mês vs anterior / YoY) nos KPIs e séries
