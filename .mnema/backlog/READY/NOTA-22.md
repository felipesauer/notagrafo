---
mnema:
  key: NOTA-22
  state: READY
  title: Setup do dashboard (@nfp/dashboard)
  description: >-
    Configurar React 18 + Vite, TanStack Router (file-based) em router.tsx,
    TanStack Query (query.client.ts), i18n (pt-BR padrão + en), tema
    claro/escuro, api.client.ts (JWT do localStorage nfp_token + refresh
    automático uma vez) e Zustand stores (auth, theme, export, graph). main.tsx
    com providers.
  acceptance_criteria:
    - Vite + TanStack Router/Query e dashboard sobe na porta 5173
    - i18n com pt-BR e en; chaves pagina.secao.elemento
    - Tema claro/escuro com toggle e default por prefers-color-scheme
    - api.client faz refresh uma vez e redireciona a /login se falhar
    - Zustand stores auth/theme/export/graph
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:20.117Z'
---
# Setup do dashboard (@nfp/dashboard)
