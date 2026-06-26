---
mnema:
  key: NOTA-29
  state: READY
  title: docker-compose com profiles app/demo
  description: >-
    Criar docker-compose.yml conforme 04 infra-testes.md: infra sempre ativa
    (redis, neo4j com apoc, minio, mailpit) com healthchecks; profile app (api,
    worker replicas 2, dashboard) com depends_on por health; profile demo (seed
    roda uma vez com DEMO=true). Volumes nomeados.
  acceptance_criteria:
    - 'Infra (redis, neo4j, minio, mailpit) sobe com healthchecks'
    - >-
      Profile app sobe api, worker (2 réplicas) e dashboard com depends_on por
      health
    - Profile demo roda o seed uma vez e encerra
    - >-
      'docker compose --profile app --profile demo up' sobe tudo; dashboard em
      :8080
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:46.774Z'
---
# docker-compose com profiles app/demo
