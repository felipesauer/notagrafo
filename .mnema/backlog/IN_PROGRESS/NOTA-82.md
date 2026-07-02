---
mnema:
  key: NOTA-82
  state: IN_PROGRESS
  title: 'Worker: graceful shutdown (SIGTERM/SIGINT -> worker.close())'
  description: >-
    worker.ts não registra handlers de SIGTERM/SIGINT e nunca chama
    worker.close() — em deploy/docker stop, jobs em andamento são cortados no
    meio (mitigado por retries + merge idempotente, mas gera retrabalho/logs de
    stall). Registrar shutdown: parar de aceitar jobs, aguardar o job ativo,
    fechar worker, conexão Redis e driver Neo4j, sair com código 0.
  acceptance_criteria:
    - >-
      SIGTERM e SIGINT disparam shutdown: worker.close() aguardando job ativo,
      fecha Redis e driver Neo4j
    - Segundo sinal força saída imediata
    - Log estruturado de início/fim do shutdown
    - Teste unit leve (spies) do fluxo; typecheck/lint/unit verdes
  labels:
    - area:worker
    - origem:auditoria-3
    - tipo:bug
  estimate: 1
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T16:41:46.194Z'
---
# Worker: graceful shutdown (SIGTERM/SIGINT -> worker.close())
