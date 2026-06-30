---
mnema:
  key: NOTA-35
  state: DONE
  title: 'API: GET /export/:id retornar progresso/total quando processing'
  description: >-
    GET /api/v1/export/:exportId no estado processing deve retornar
    {exportId,status,progresso,total} (contrato 02 seção 6). O ExportService
    precisa expor progresso/total durante a geração. Achado #4.
  acceptance_criteria:
    - ExportService rastreia progresso/total durante a geração
    - GET /export/:id retorna progresso e total quando processing
    - Teste valida a resposta no estado processing (não só ready)
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:41:46.744Z'
---
# API: GET /export/:id retornar progresso/total quando processing
