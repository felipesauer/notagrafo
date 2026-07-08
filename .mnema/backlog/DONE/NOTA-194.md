---
mnema:
  key: NOTA-194
  state: DONE
  title: 'Comandos claros: scripts dev/stack/down coerentes + compose profiles'
  description: >-
    Reorganizar scripts em 3 modos explícitos: pnpm dev (infra docker + app
    host, hot-reload), pnpm stack (app containerizado), pnpm demo (stack +
    seed). pnpm down para TUDO (app+infra, libera portas). pnpm infra sobe só
    infra. docker:up/down viram aliases. README com tabela de modos.
  acceptance_criteria:
    - pnpm dev = infra docker + app host (hot-reload)
    - comando dedicado p/ stack app containerizada (pnpm stack)
    - pnpm down fecha infra+app (portas liberadas)
    - comandos documentados no README
  labels:
    - docker
    - dx
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T14:29:33.478Z'
---
# Comandos claros: scripts dev/app/down coerentes + compose profiles
