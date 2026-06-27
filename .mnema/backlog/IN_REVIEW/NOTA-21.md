---
mnema:
  key: NOTA-21
  state: IN_REVIEW
  title: Testes de integração da API (Testcontainers)
  description: >-
    Criar setup.integration.ts (Neo4j e Redis reais via Testcontainers, injeta
    URIs, roda migrations, limpa banco entre testes) e os *.integration.test.ts
    cobrindo upload (XML/ZIP, duplicata, XSD inválido),
    listagem/filtros/paginação, detalhe, grafo e export. Config em
    vitest.integration.config.ts.
  acceptance_criteria:
    - setup.integration.ts sobe Neo4j+Redis via Testcontainers e roda migrations
    - Banco limpo entre testes (afterEach)
    - Testes cobrem upload, listagem, detalhe, grafo e export com serviços reais
    - pnpm test:integration verde
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-5
  sprint_key: NOTA-SPRINT-5
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T04:37:03.392Z'
---
# Testes de integração da API (Testcontainers)
