---
mnema:
  key: NOTA-113
  state: IN_REVIEW
  title: Remover shell/páginas antigos + varredura final (Explorer vira shell)
  description: >-
    Explorer vira o shell inteiro (home /), fim da navegação dupla. Remover
    NavSidebar/SiteHeader/breadcrumbs + páginas NFList/Companies/Products/Taxes
    absorvidas + rotas de lista. Telas secundárias com SecondaryHeader. e2e
    reescritos para a nova navegação.
  acceptance_criteria:
    - >-
      Explorer é o shell (home); NavSidebar/SiteHeader/páginas de lista
      removidos
    - shell unificado (sem navegação dupla); telas secundárias com header leve
    - e2e reescritos verdes; sem rota morta
    - verificação visual claro+escuro; build/lint verdes
  labels: []
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T23:03:13.428Z'
---
# Remover shell/páginas antigos + varredura final
