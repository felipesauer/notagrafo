---
mnema:
  key: NOTA-104
  state: DRAFT
  title: >-
    NFList: listagem legível (razão social) + menu de ações por linha +
    ordenação
  description: >-
    Mostrar RAZÃO SOCIAL em destaque + CNPJ pequeno mono (a API já retorna
    emitente.razaoSocial — só front). Menu ... (DropdownMenu) por linha: ver
    detalhe, abrir no grafo desta empresa, baixar XML, copiar chave, filtrar por
    este emitente. Linha inteira clicável para o detalhe. Ativar ordenação por
    coluna via SortableHead + parâmetros orderBy/order que o listInvoices JÁ
    suporta (revisita parcialmente ADR-9). Rodapé '1–20 de 90'. e2e verde.
  acceptance_criteria:
    - razão social + CNPJ pequeno nas colunas de partes
    - menu de ações por linha (5 ações) + linha clicável
    - ordenação por coluna via API (orderBy/order)
    - e2e nf-list/nf-detail verdes
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T02:44:26.844Z'
---
# NFList: listagem legível (razão social) + menu de ações por linha + ordenação
