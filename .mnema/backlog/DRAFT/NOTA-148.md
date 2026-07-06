---
mnema:
  key: NOTA-148
  state: DRAFT
  title: 'Lista de NF-e (ExplorerNotas): ordenação server-side + paginação por cursor'
  description: >-
    ExplorerNotas passa a ordenar via orderBy/order (que /nf já aceita:
    dataEmissao, dataSaida, valorTotal, numero, chaveAcesso) clicando no
    cabeçalho, e a paginar por cursor (Anterior/Próxima usando nextCursor) +
    seletor de page size (refaz a query com novo limit). Cabeçalhos
    não-ordenáveis (emitente/destinatário/chave) ficam estáticos. Manter o peek
    e as ações inline.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-21
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T20:04:56.869Z'
---
# Lista de NF-e (ExplorerNotas): ordenação server-side + paginação por cursor
