---
mnema:
  key: NOTA-14
  state: READY
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:49.914Z'
---
# Filas BullMQ e jobs de processamento
