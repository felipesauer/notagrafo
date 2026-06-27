---
mnema:
  key: NOTA-29
  state: IN_REVIEW
  title: docker-compose com profiles app/demo
  description: >-
    Criar docker-compose.yml conforme 04 infra-testes.md: infra sempre ativa
    (redis, neo4j com apoc, minio, mailpit) com healthchecks; profile app (api,
    worker replicas 2, dashboard) com depends_on por health; profile demo (seed
    roda uma vez com DEMO=true). Volumes nomeados.
  acceptance_criteria:
    - Infra (redis, neo4j, minio, mailpit) sobe com healthchecks
    - >-
      Profile app sobe api, worker (2 réplicas) e dashboard com depends_on por
      health
    - Profile demo roda o seed uma vez e encerra
    - >-
      'docker compose --profile app --profile demo up' sobe tudo; dashboard em
      :8080
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-7
  sprint_key: NOTA-SPRINT-7
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T12:48:59.233Z'
---
# docker-compose com profiles app/demo
