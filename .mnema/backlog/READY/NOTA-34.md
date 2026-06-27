---
mnema:
  key: NOTA-34
  state: READY
  title: 'API: corrigir GET /nf/:chave/eventos para o contrato'
  description: >-
    GET /api/v1/nf/:chave/eventos: adicionar chaveAcesso no nível raiz; ajustar
    o campo 'detalhes' não previsto e incluir ipOrigem quando presente; garantir
    timestamp ISO8601. Contrato seção 4. Achado #3.
  acceptance_criteria:
    - Resposta tem chaveAcesso no topo + array eventos
    - >-
      Cada evento expõe os campos do contrato (tipo, timestamp ISO8601, autor,
      ipOrigem?)
    - timestamp validado como ISO8601 no teste
    - Teste de integração cobre o endpoint
  estimate: 2
  priority: 2
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T22:55:39.816Z'
---
# API: corrigir GET /nf/:chave/eventos para o contrato
