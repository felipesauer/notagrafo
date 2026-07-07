---
mnema:
  key: NOTA-165
  state: DONE
  title: 'Backend: rotas register + PATCH me + PATCH password'
  description: >-
    POST /auth/register (cria conta, 409 se email existe, retorna token+user).
    PATCH /auth/me (altera nome/email, reemite JWT). PATCH /auth/password
    (senhaAtual+novaSenha, 401 se atual errada). Schemas OpenAPI + testes de
    rota (sucesso/401/409/400).
  acceptance_criteria:
    - POST /auth/register cria conta e retorna token (409 se duplicado)
    - PATCH /auth/me altera nome/email e reemite token
    - PATCH /auth/password troca senha validando a atual
    - Testes de rota verdes
  labels:
    - api
    - auth
    - backend
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:25:14.209Z'
---
# Backend: rotas POST /auth/register + PATCH /auth/me + PATCH /auth/password
