---
mnema:
  key: NOTA-180
  state: DONE
  title: Detecção de NF-e duplicadas/suspeitas
  description: >-
    findDuplicateInvoices: mesmo emitente+data+valor, 2+ NF (heurística de
    negócio, não a dedup por chave). Exclui devoluções. Endpoint
    /stats/anomalias. Teste.
  acceptance_criteria:
    - Detecta grupos emitente+data+valor com 2+ NF
    - Não confunde com dedup por chave
    - Endpoint + teste
  labels:
    - analise
    - api
    - bi
    - graph
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-26
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T18:33:59.815Z'
---
# Detecção de NF-e duplicadas/suspeitas
