---
mnema:
  key: NOTA-181
  state: IN_REVIEW
  title: Gaps de numeração de NF-e (sequência com buracos)
  description: >-
    findNumberingGaps: por emitente+série, detecta saltos na sequência de nNF
    (numérico). Retorna from/to/missing. Endpoint /stats/anomalias. Teste.
    Verificado: 50 gaps no seed.
  acceptance_criteria:
    - Detecta lacunas de nNF por emitente+série
    - Só nNF numérico
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
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T17:57:02.441Z'
---
# Gaps de numeração de NF-e (sequência com buracos)
