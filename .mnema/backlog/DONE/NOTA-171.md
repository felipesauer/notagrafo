---
mnema:
  key: NOTA-171
  state: DONE
  title: 'api: tax.queries agrega IBS/CBS/IS'
  description: >-
    TaxTotais + TaxSeriePonto incluem vIBS/vIBSUF/vIBSMun/vCBS/vIS; queries de
    totais e série somam os novos total_*. Rota /stats/impostos expõe (schema
    genérico). Teste de query atualizado.
  acceptance_criteria:
    - TaxTotais inclui IBS/CBS/IS
    - série mensal soma os novos
    - Testes verdes
  labels:
    - api
    - fiscal
    - reforma
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:37:37.979Z'
---
# api: tax.queries agrega IBS/CBS/IS (composição + série + filtros)
