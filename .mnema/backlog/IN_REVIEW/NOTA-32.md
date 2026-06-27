---
mnema:
  key: NOTA-32
  state: IN_REVIEW
  title: 'API: completar resposta de GET /nf/jobs/:jobId conforme contrato'
  description: >-
    GET /api/v1/nf/jobs/:jobId hoje retorna só {jobId,status,progresso,erro?}. O
    contrato (02 contratos api.md seção 3) pede, para processing/completed:
    total, iniciadoEm; e para completed também concluidoEm e
    resultado{processadas,duplicatas,erros}. Mapear dos dados do job BullMQ
    (timestamp/processedOn/finishedOn/returnvalue). Achado #1 da auditoria.
  acceptance_criteria:
    - Resposta inclui total e iniciadoEm quando processing/completed
    - >-
      Resposta inclui concluidoEm e resultado{processadas,duplicatas,erros}
      quando completed
    - Resposta inclui erro/tentativas quando failed (mantido)
    - Teste de integração cobre GET /nf/jobs/:jobId nos estados relevantes
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T23:02:17.040Z'
---
# API: completar resposta de GET /nf/jobs/:jobId conforme contrato
