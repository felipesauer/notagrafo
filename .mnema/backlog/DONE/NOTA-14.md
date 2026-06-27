---
mnema:
  key: NOTA-14
  state: DONE
  title: Filas BullMQ e jobs de processamento
  description: >-
    Criar filas BullMQ (Redis) e o job de NFe: parse → validate (XSD) →
    mergeNotaFiscal → storage. Concorrência (WORKER_CONCURRENCY), retries
    (JOB_MAX_RETRIES), backoff (JOB_BACKOFF_DELAY), DLQ. Bloqueio de duplicata
    por chaveAcesso. Métricas de fila (depth, failed).
  acceptance_criteria:
    - >-
      Job processa NFe ponta a ponta: parse, validação XSD, merge no grafo e
      storage
    - Retries com backoff e DLQ após JOB_MAX_RETRIES
    - Duplicata detectada e não reprocessada
    - Métricas de profundidade de fila e jobs falhos expostas
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-4
  sprint_key: NOTA-SPRINT-4
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T23:02:26.881Z'
---
# Filas BullMQ e jobs de processamento
