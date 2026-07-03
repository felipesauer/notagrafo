---
mnema:
  key: NOTA-104
  state: IN_REVIEW
  title: >-
    NFList: listagem legível (razão social) + menu de ações por linha +
    ordenação
  description: >-
    Razão social em destaque + CNPJ pequeno mono (API já retorna
    emitente.razaoSocial). Menu ... (DropdownMenu) por linha: ver detalhe, abrir
    no grafo desta empresa, baixar XML, copiar chave, filtrar por este emitente.
    Linha clicável para o detalhe. Ordenação por coluna via orderBy/order que
    listInvoices já suporta. Rodapé N de M já feito na 103. e2e verde.
  acceptance_criteria:
    - razão social + CNPJ pequeno nas colunas de partes
    - menu de ações por linha + linha clicável
    - ordenação por coluna via API (orderBy/order)
    - e2e nf-list/nf-detail verdes
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T02:54:55.040Z'
---
# NFList: listagem legível (razão social) + menu de ações por linha + ordenação
