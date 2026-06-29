---
mnema:
  key: NOTA-41
  state: IN_REVIEW
  title: Alinhar status do job ao contrato (waiting/active/delayed → processing)
  description: >-
    Achado C (MÉDIA): GET /nf/jobs/:jobId retorna status cru do BullMQ
    (waiting/active/delayed); contrato §3 só define processing/completed/failed.
    Mapear estados não-terminais para 'processing'. Manter completed/failed.
    Atualizar teste de integração.
  acceptance_criteria:
    - >-
      waiting/active/delayed/paused mapeados para status 'processing' na
      resposta
    - completed e failed inalterados
    - Teste cobre o mapeamento de status intermediario
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-28T22:30:57.619Z'
---
# Alinhar status do job ao contrato (waiting/active/delayed → processing)
