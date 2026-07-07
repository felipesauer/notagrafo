---
mnema:
  key: NOTA-168
  state: DONE
  title: URLs do dashboard traduzidas PT→EN (com redirects de compatibilidade)
  description: >-
    Rotas traduzidas: /explorar→/explore, /grafo→/graph, /exportacoes→/exports,
    /configuracoes→/settings, /nf/$chave→/invoice/$chave, /cadastro→/register.
    Router + call-sites de navegação + e2e. Paths de API NÃO tocados. Redirects
    legados PT→EN preservam bookmarks. Validado E2E, lint+tsc+build verdes.
  acceptance_criteria:
    - Rotas em inglês
    - Redirects PT→EN preservam bookmarks
    - Paths de API intactos
    - e2e apontam para EN
    - E2E + lint/tsc/build verdes
  labels:
    - dashboard
    - i18n
    - routing
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:37:27.467Z'
---
# URLs do dashboard traduzidas PT→EN (com redirects de compatibilidade)
