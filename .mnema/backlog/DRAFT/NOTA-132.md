---
mnema:
  key: NOTA-132
  state: DRAFT
  title: 'UX: Home ''Últimas NFs processadas'' sem colunas/ações do padrão da listagem'
  description: >-
    Usuário: 'falta de ações e informações na listagem das Últimas NFs na home'.
    Overview.tsx:302-335 mostra só Número(link)/Valor/Processada em. A listagem
    principal (ExplorerNotas) tem emitente, destinatário, status e ações inline
    (ver/baixar/grafo). Correção: enriquecer a tabela das Últimas NFs com
    emitente, status e ações inline (Eye/Download/Waypoints com Tooltip),
    reaproveitando o padrão de ExplorerNotas — mantendo densidade/tabular-nums.
    Considerar limitar colunas no mobile.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 2
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:42.990Z'
---
# UX: Home 'Últimas NFs processadas' sem colunas/ações do padrão da listagem
