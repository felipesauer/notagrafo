---
mnema:
  key: NOTA-195
  state: DONE
  title: 'Subida mais rápida: healthchecks afinados + worker 1 réplica'
  description: >-
    Infra levava ~29s no up --wait pelo healthcheck interval de 10s (não pelo
    boot). Ajustes: neo4j/minio interval 10s→3s + start_period; worker replicas
    2→1 (configurável WORKER_REPLICAS); seed já era profile separado. Resultado:
    pnpm infra 29s→15s.
  acceptance_criteria:
    - tempo de up --wait medido antes/depois (29s→15s)
    - neo4j healthcheck afinado sem falsos unhealthy
    - worker 1 réplica (config WORKER_REPLICAS)
    - caminho E2E documentado (README)
  labels:
    - docker
    - dx
    - performance
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T15:46:28.488Z'
---
# Subida mais rápida: otimizar healthchecks/ordem + seed opcional
