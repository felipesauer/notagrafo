---
mnema:
  key: NOTA-78
  state: IN_REVIEW
  title: GET /export (listagem) + hidratar histórico da página Exportações
  description: >-
    Não existe endpoint de listagem (export.routes.ts só tem POST /export, GET
    /export/:id e /download) e Exports.tsx guarda o histórico só em useState —
    recarregou, sumiu, mesmo com jobs ready no Redis. O .plan/03 §9 pede tabela
    com histórico de exportações do usuário. Implementar GET /export (lista do
    usuário autenticado, do Redis+memória) com OpenAPI, e a página hidratar ao
    montar.
  acceptance_criteria:
    - >-
      GET /export retorna lista (id, status, formato, criadoEm, expiraEm) do
      usuário autenticado, documentado no OpenAPI
    - >-
      Página Exportações carrega histórico ao montar e atualiza após criar novo
      export
    - Jobs expirados (TTL) têm comportamento definido e testado
    - Testes de integração/unit do novo endpoint; typecheck/lint/unit verdes
  labels:
    - area:api
    - area:dashboard
    - origem:auditoria-3
    - tipo:gap
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T17:51:20.533Z'
---
# GET /export (listagem) + hidratar histórico da página Exportações
