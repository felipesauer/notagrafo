---
mnema:
  key: NOTA-206
  state: DONE
  title: 'Perf: índices Neo4j para nf.valorTotal e nf.numero'
  description: >-
    migrations.ts não cria índice para nf.valorTotal (filtro valorTotalMin/Max +
    ORDER BY de listInvoices) nem nf.numero (filtro por igualdade; fulltext
    nf_search não serve). Adicionar RANGE index para ambos. nf.finalidade fica
    de fora (função+negação no predicado não é indexável) — documentado.
  acceptance_criteria:
    - índices nf_valorTotal e nf_numero criados nas migrations
    - PROFILE/EXPLAIN mostra uso do índice
    - migrations idempotentes (IF NOT EXISTS)
    - suíte de integração continua verde
  labels:
    - area:graph
    - dim:performance
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:57:48.761Z'
---
# Perf: índices Neo4j para nf.valorTotal e nf.numero
