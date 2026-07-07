---
mnema:
  key: NOTA-180
  state: DRAFT
  title: Detecção de NF-e duplicadas/suspeitas
  description: >-
    Query que identifica possíveis duplicatas: mesmo emitente + mesmo valorTotal
    + datas próximas (ex.: mesma data), ou nNF repetido por emitente/série. Não
    é a dedup por chave (essa já existe no MERGE) — é heurística de negócio. API
    endpoint /stats/anomalias/duplicatas; dashboard: card/lista na tela de
    anomalias com link para as NF. Testes.
  acceptance_criteria:
    - Detecta NF com emitente+valor+data coincidentes (ou nNF repetido)
    - Endpoint + lista no dashboard com drill para as NF
    - Não confunde com a dedup por chave existente
    - Testes
  labels:
    - analise
    - api
    - bi
    - graph
  estimate: 5
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:32:24.083Z'
---
# Detecção de NF-e duplicadas/suspeitas
