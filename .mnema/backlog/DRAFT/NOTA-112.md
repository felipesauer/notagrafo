---
mnema:
  key: NOTA-112
  state: DRAFT
  title: Cmd+K expandido + views salvas favoritáveis
  description: >-
    Expandir a command palette (Cmd+K) existente: colar chave de 44 dígitos →
    abre NF; buscar empresa por CNPJ/razão social; navegar para entidades e
    views salvas; ações rápidas (enviar NF-e, exportar, alternar tema/idioma).
    Implementar views salvas: salvar um conjunto de filtros como view nomeada,
    favoritável na sidebar (seção 'Minhas views'), com persistência
    (localStorage ou backend se simples). Cmd+K global e alternável (mesmo
    atalho fecha).
  acceptance_criteria:
    - 'Cmd+K: chave→NF, CNPJ/nome→empresa, ir para entidades/views, ações'
    - views salvas nomeadas + favoritas na sidebar, persistidas
    - Cmd+K global e toggle (mesmo atalho abre/fecha)
    - build/lint/test:unit/e2e verdes
  labels: []
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:56:08.212Z'
---
# Cmd+K expandido + views salvas favoritáveis
