---
mnema:
  key: NOTA-181
  state: DRAFT
  title: Gaps de numeração de NF-e (sequência com buracos)
  description: >-
    Por emitente+série, detectar buracos na sequência de nNF (ex.: emitiu
    100,101,103 → falta 102). Sinaliza possível NF não importada/emitida. Query
    no graph (ordena nNF por emitente/série, acha lacunas); API endpoint;
    dashboard: card na tela de anomalias listando (emitente, série, faixa
    faltante). Testes. Cuidar de nNF não-numérico/reset por série.
  acceptance_criteria:
    - Detecta lacunas de nNF por emitente+série
    - Endpoint + card no dashboard
    - Trata reset de numeração/séries múltiplas
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
  updated_at: '2026-07-07T16:32:24.087Z'
---
# Gaps de numeração de NF-e (sequência com buracos)
