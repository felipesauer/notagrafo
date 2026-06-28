---
mnema:
  key: NOTA-40
  state: IN_REVIEW
  title: Cobertura unit para 90% global (mock de driver/queue/storage)
  description: >-
    Achado A (ALTA): cobertura unit real é 39,83% (não 80%). Escrever testes
    unitários com mocks para auth.routes, nf.routes, nf.repository, queries
    (graph), queue, seed e stats.routes, atingindo lines/functions >=90%.
    Ajustar thresholds em vitest.config.ts para 90/90/85 só após bater a meta.
    Baseline atual: unit 37/37.
  acceptance_criteria:
    - Cobertura unit lines >=90% e functions >=90% (pnpm test:coverage)
    - >-
      Testes unitarios novos nao dependem de Testcontainers (mocks de
      driver/queue/storage)
    - vitest.config.ts com thresholds atualizados (>=90 lines/functions)
    - Suite unit continua verde
  estimate: 13
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-28T22:28:20.985Z'
---
# Cobertura unit para 90% global (mock de driver/queue/storage)
