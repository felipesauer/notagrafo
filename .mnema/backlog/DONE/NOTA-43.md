---
mnema:
  key: NOTA-43
  state: DONE
  title: GET /nf/:chave/eventos retorna 404 para NF inexistente
  description: >-
    Achado E (BAIXA): /eventos retorna 200 {eventos:[]} para chave inexistente,
    enquanto /nf/:chave dá 404. Checar existência da NF antes e responder 404
    NF_NOT_FOUND quando não existir. Adicionar teste.
  acceptance_criteria:
    - /eventos responde 404 NF_NOT_FOUND para chave inexistente
    - NF existente sem eventos ainda retorna 200 com eventos:[]
    - Teste de integracao cobre o 404
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T02:35:41.154Z'
---
# GET /nf/:chave/eventos retorna 404 para NF inexistente
