---
mnema:
  key: NOTA-174
  state: DONE
  title: Export de tributos (ICMS/IPI/PIS/COFINS + IBS/CBS/IS) selecionáveis
  description: >-
    listInvoices/NFListItem expõe os total_v* num objeto tributos; flattenRow
    achata; novo grupo 'Tributos' no export do dashboard. i18n. Testes + E2E (NF
    de reforma exporta IBS/CBS/IS preenchidos).
  acceptance_criteria:
    - listInvoices/NFListItem retorna os total_v*
    - Export com grupo 'Tributos' preenchido
    - i18n
    - Testes + E2E
  labels:
    - dashboard
    - export
    - fiscal
    - graph
    - reforma
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:24:45.357Z'
---
# Export de tributos (ICMS/IPI/PIS/COFINS + IBS/CBS/IS) selecionáveis
