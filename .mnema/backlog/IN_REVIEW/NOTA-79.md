---
mnema:
  key: NOTA-79
  state: IN_REVIEW
  title: >-
    Export: job 'processing' órfão após restart deve terminar (failed), não
    ficar eterno
  description: >-
    ExportService.generate() só é disparado no create(); se a API reinicia
    durante a geração, o job recuperado do Redis fica em processing para sempre
    (polling infinito do cliente). Violação parcial do ADR-5. Ao recuperar do
    Redis um job processing sem geração ativa nesta instância, transicionar para
    failed (mensagem de restart) ou retomar a geração, e persistir.
  acceptance_criteria:
    - >-
      Job processing recuperado do Redis sem geração ativa vira failed com
      mensagem clara (ou é retomado e conclui)
    - GET /export/:id nunca retorna processing eterno após restart
    - >-
      Teste unit simulando o cenário (job processing vindo do Redis, sem tarefa
      ativa)
    - typecheck/lint/unit verdes
  labels:
    - area:api
    - origem:auditoria-3
    - tipo:bug
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T17:51:20.738Z'
---
# Export: job 'processing' órfão após restart deve terminar (failed), não ficar eterno
