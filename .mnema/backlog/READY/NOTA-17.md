---
mnema:
  key: NOTA-17
  state: READY
  title: Auth JWT manual e rotas /auth/* (ADR NOTA-ADR-1)
  description: >-
    Implementar auth com JWT manual (@fastify/jwt) conforme ADR NOTA-ADR-1:
    auth.plugin.ts (Bearer em todas as rotas exceto /health, /auth/login,
    /auth/refresh) e auth.routes.ts (POST /auth/login, /logout, /refresh, GET
    /me). Usuários como nós no Neo4j. Contrato externo idêntico ao 02
    contratos-api.md.
  acceptance_criteria:
    - 'POST /auth/login retorna token, expiresAt e user'
    - Rotas protegidas exigem Bearer e retornam 401 sem token válido
    - /auth/refresh renova; /auth/me retorna o usuário
    - Usuários no Neo4j com senha hasheada
    - Segue ADR NOTA-ADR-1 (sem Better Auth)
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:03.749Z'
---
# Auth JWT manual e rotas /auth/* (ADR NOTA-ADR-1)
