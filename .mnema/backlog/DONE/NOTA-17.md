---
mnema:
  key: NOTA-17
  state: DONE
  title: Auth JWT manual e rotas /auth/* (ADR NOTA-ADR-1)
  description: >-
    Implementar auth com JWT manual (@fastify/jwt) conforme ADR NOTA-ADR-1:
    auth.plugin.ts (Bearer em todas as rotas exceto /health, /auth/login,
    /auth/refresh) e auth.routes.ts (POST /auth/login, /logout, /refresh, GET
    /me). Usuários como nós no Neo4j. Contrato externo idêntico ao 02
    contratos-api.md.
  acceptance_criteria:
    - POST /auth/login retorna token, expiresAt e user
    - Rotas protegidas exigem Bearer e retornam 401 sem token válido
    - /auth/refresh renova; /auth/me retorna o usuário
    - Usuários no Neo4j com senha hasheada
    - Segue ADR NOTA-ADR-1 (sem Better Auth)
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-5
  sprint_key: NOTA-SPRINT-5
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T00:02:59.872Z'
---
# Auth JWT manual e rotas /auth/* (ADR NOTA-ADR-1)
