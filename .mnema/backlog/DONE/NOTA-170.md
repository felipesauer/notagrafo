---
mnema:
  key: NOTA-170
  state: DONE
  title: 'graph: persistir totais IBS/CBS/IS (total_v*)'
  description: >-
    Os novos totais fluem ao nó NotaFiscal como
    total_vIBS/vIBSUF/vIBSMun/vCBS/vIS. serializeInvoice genérico já cobria;
    teste unit (fake driver) comprova.
  acceptance_criteria:
    - total_v* da reforma gravados no nó
    - coalesce 0 quando ausente
    - Teste comprovando
  labels:
    - fiscal
    - graph
    - reforma
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:37:35.495Z'
---
# graph: persistir totais IBS/CBS/IS no nó NotaFiscal (total_v*)
