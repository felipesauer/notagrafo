---
mnema:
  key: NOTA-23
  state: READY
  title: Layout global e página de Login
  description: >-
    Criar layout global (Sidebar com 7 itens, Header com breadcrumb + toggle de
    tema/idioma + sino, ExportBanner persistente com polling 10s) e a página
    /login (e-mail + senha, erro inline, redirect para rota de origem, sem
    registro público). Rotas protegidas redirecionam a /login sem token.
  acceptance_criteria:
    - Sidebar com os 7 itens e footer com usuário/logout
    - Header com breadcrumb, toggle de tema, idioma e sino
    - ExportBanner persiste entre navegações e faz polling a cada 10s
    - >-
      /login autentica, trata erro inline e redireciona; rotas protegidas exigem
      token
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-6
  sprint_key: NOTA-SPRINT-6
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T23:20:54.774Z'
---
# Layout global e página de Login
