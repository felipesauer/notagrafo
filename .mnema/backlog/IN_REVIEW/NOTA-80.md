---
mnema:
  key: NOTA-80
  state: IN_REVIEW
  title: 'Worker: mover jobs esgotados para a DLQ (NF_DLQ)'
  description: >-
    NF_DLQ é declarada em queue/config.ts:6 e prometida na doc (.plan/00
    'tentativas antes de ir para DLQ'; .env.example JOB_MAX_RETRIES), mas nada a
    usa — jobs que esgotam retries ficam na fila principal com
    removeOnFail:false. Implementar: no evento failed com attemptsMade>=max,
    enfileirar o job (payload+erro+tentativas) na NF_DLQ e limpar da principal,
    com log estruturado.
  acceptance_criteria:
    - >-
      Job que esgota JOB_MAX_RETRIES vai para NF_DLQ com payload original, erro
      e nº de tentativas
    - Job não permanece pendurado na fila principal após ir para a DLQ
    - Log estruturado registra a ida para a DLQ (chave da NF, jobId, erro)
    - >-
      Teste unit do handler de failed (mock de Queue); typecheck/lint/unit
      verdes
  labels:
    - area:worker
    - origem:auditoria-3
    - tipo:gap
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T17:51:20.947Z'
---
# Worker: mover jobs esgotados para a DLQ (NF_DLQ)
