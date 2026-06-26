---
mnema:
  key: NOTA-ADR-1
  kind: decision
  status: proposed
  title: 'Auth: JWT manual com @fastify/jwt em vez de Better Auth'
  context: >-
    O levantamento especificava Better Auth para emissão de JWT Bearer. Porém
    Better Auth exige um banco de dados relacional dedicado (para usuários,
    sessões, magic links) que não está previsto na stack do projeto — que
    contempla apenas Neo4j (grafo) e Redis (fila). Adotar Better Auth implicaria
    adicionar SQLite ou Postgres à infraestrutura (Docker Compose, migrations,
    backups), aumentando a superfície do MVP.
  decision: >-
    No MVP, a autenticação será implementada com JWT manual usando @fastify/jwt,
    persistindo usuários como nós no Neo4j, em vez de usar Better Auth como
    previa o levantamento original (02 contratos-api.md e 00 visao-geral.md).
  rationale: >-
    JWT manual com @fastify/jwt entrega o mesmo contrato externo da API (login
    retorna token + expiresAt + user; rotas protegidas via Authorization:
    Bearer) sem introduzir um novo serviço de banco. Os usuários (poucos,
    criados via Configurações) cabem como nós no Neo4j já existente. Mantém a
    stack enxuta e o quickstart de 5 minutos. O contrato dos endpoints /auth/*
    permanece idêntico ao do levantamento — apenas a implementação interna muda.
  consequences: >-
    Funcionalidades de Better Auth fora do escopo do MVP (magic link de convite
    por e-mail, refresh sofisticado de sessão) ficam simplificadas: convite de
    usuário e troca de senha são tratados manualmente. As variáveis
    SMTP/magic-link do .env.example podem ser removidas ou marcadas como
    futuras. Se no futuro for necessário SSO/OAuth, reavaliar a adoção de Better
    Auth ou de um IdP externo, possivelmente exigindo migração dos usuários do
    Neo4j.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/api/src/plugins/auth.plugin.ts
    - packages/api/src/routes/auth.routes.ts
    - packages/api/src/schemas/auth.schemas.ts
    - .env.example
    - 02 contratos api.md
  metadata: {}
  at: '2026-06-26T00:46:31.360Z'
---
# Auth: JWT manual com @fastify/jwt em vez de Better Auth
