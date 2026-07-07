---
mnema:
  key: NOTA-176
  state: DRAFT
  title: Indicador de transição da Reforma (NF com IBS/CBS vs pré-reforma)
  description: >-
    KPI/card no dashboard mostrando o progresso da transição: quantas/qual % das
    NF-e já vêm com IBS/CBS/IS vs. pré-reforma. Backend: nova agregação (count
    NF com total_vIBS>0 vs total) — pode entrar no /stats/overview ou
    /stats/impostos. Dashboard: card na Home ou no topo de Impostos, com
    barra/percentual. i18n. Útil no período de convivência dos dois modelos.
  acceptance_criteria:
    - API retorna contagem de NF com reforma vs total
    - Card/indicador de transição visível no dashboard
    - i18n pt-BR/en
    - Testes
  labels:
    - api
    - dashboard
    - fiscal
    - reforma
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:40:49.411Z'
---
# Indicador de transição da Reforma (NF com IBS/CBS vs pré-reforma)
