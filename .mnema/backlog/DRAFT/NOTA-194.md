---
mnema:
  key: NOTA-194
  state: DRAFT
  title: 'Comandos claros: scripts dev/app/down coerentes + compose profiles'
  description: >-
    Reorganizar os scripts do package.json e profiles do compose. `pnpm dev` =
    infra no docker (neo4j/redis/minio/mailpit) + app no host com hot-reload
    (decisão do usuário). Comando dedicado para stack app containerizada
    (E2E/demo). `pnpm docker:down` fecha TUDO (infra + app + demo), liberando
    portas. worker replicas:1 em dev. Remover a mistura docker+host do `dev`
    atual. Documentar cada comando no README.
  acceptance_criteria: []
  labels:
    - docker
    - dx
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T13:30:18.558Z'
---
# Comandos claros: scripts dev/app/down coerentes + compose profiles
