---
mnema:
  key: NOTA-66
  state: IN_REVIEW
  title: >-
    Corrigir config de integração obsoleta no Vitest 4 (serialização de
    Testcontainers)
  description: >-
    Achado A0 da auditoria de integridade (2026-06-30).
    vitest.integration.config.ts usa `poolOptions.threads.singleThread: true` no
    formato do Vitest 3, REMOVIDO no Vitest 4 — a suíte emite 'DEPRECATED:
    test.poolOptions was removed in Vitest 4' e IGNORA a opção. Com isso a
    serialização que evita conflito de containers paralelos está desativada
    desde o bump para Vitest 4, e `pnpm test:integration` estoura 'Hook timed
    out in 120000ms' / 'Log message Started. not received' ao subir 10+ Neo4j
    simultâneos. PROVA empírica: rodar arquivos com --fileParallelism=false
    passa 9/9 em 46s. Migrar a config para o formato do Vitest 4:
    `fileParallelism: false` (top-level) — ou o equivalente em poolOptions do
    novo formato — restaurando a execução serializada da suíte de integração.
  acceptance_criteria:
    - >-
      vitest.integration.config.ts não usa mais a chave obsoleta
      poolOptions.threads.singleThread (sem warning DEPRECATED ao rodar)
    - >-
      A suíte de integração roda serializada (fileParallelism:false ou
      equivalente do Vitest 4)
    - >-
      pnpm test:integration não falha por 'Hook timed out' decorrente de
      contenção de containers paralelos
    - typecheck e lint seguem verdes
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T17:03:09.075Z'
---
# Corrigir config de integração obsoleta no Vitest 4 (serialização de Testcontainers)
