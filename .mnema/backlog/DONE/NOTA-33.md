---
mnema:
  key: NOTA-33
  state: DONE
  title: 'API: GET /nf retornar meta{total,filtrosAtivos}'
  description: >-
    GET /api/v1/nf retorna {data,pagination} mas falta
    meta:{total,filtrosAtivos} (contrato 02 seção 4). Adicionar contagem total
    respeitando os mesmos filtros + lista de filtros ativos. O total pode ser
    uma COUNT separada no graph. Achado #2.
  acceptance_criteria:
    - Resposta inclui meta.total (contagem respeitando os filtros aplicados)
    - Resposta inclui meta.filtrosAtivos (lista das chaves de filtro usadas)
    - Teste de integração valida meta.total e filtrosAtivos
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:41:39.540Z'
---
# API: GET /nf retornar meta{total,filtrosAtivos}
