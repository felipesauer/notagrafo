---
mnema:
  key: NOTA-138
  state: DRAFT
  title: Extrair RowActions (ver/baixar/grafo) para componente compartilhado
  description: >-
    As ações inline ver/baixar/grafo com Tooltip estão duplicadas em
    ExplorerNotas.tsx:19 e Overview.tsx (UltimaNFActions). Extrair para um único
    componente compartilhado (ex.: components/RowActions.tsx ou em shared.tsx)
    recebendo chave + cnpjEmitente, e usar nos dois lugares. Base do padrão de
    ações.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:refactor
  estimate: 2
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-20
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T18:39:23.336Z'
---
# Extrair RowActions (ver/baixar/grafo) para componente compartilhado
