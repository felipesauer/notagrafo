---
mnema:
  key: NOTA-42
  state: IN_REVIEW
  title: Reportar progresso real do job (updateProgress)
  description: >-
    Achado D (MÉDIA menor): processNFe não chama updateProgress; progresso fica
    0 até concluir. Passar o job/callback de progresso ao processNFe e reportar
    marcos (validação/parse/grafo/storage). Atualizar o GET para refletir.
  acceptance_criteria:
    - >-
      processNFe reporta progresso em marcos do pipeline
      (validacao/parse/grafo/storage)
    - GET /nf/jobs/:jobId reflete progresso entre 0 e 100
    - Teste valida progresso > 0 durante o processamento
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-28T22:34:05.644Z'
---
# Reportar progresso real do job (updateProgress)
