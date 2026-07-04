---
mnema:
  key: NOTA-115
  state: DRAFT
  title: >-
    Drill-through Visão Geral → Explorer + filtros ufEmitente/cnpjEmitente
    (ponta a ponta)
  description: >-
    Fechar o Power BI: cross-filter/drill-through da Visão Geral para o Explorer
    filtrado. Requer filtros reais de ponta a ponta: (1) query Cypher de
    listagem de NF em @notagrafo/graph aceita ufEmitente (2 letras) e
    cnpjEmitente (14 dígitos); (2) schema da rota GET /nf na API valida os dois
    params opcionais e os repassa ao repositório; (3) useNFList + validateSearch
    da rota '/' aceitam os campos; (4) ExplorerNotas repassa os filtros; (5) na
    Visão Geral, clicar numa barra de Distribuição por UF navega para
    /?entity=notas&ufEmitente=XX e clicar num fornecedor do Top Fornecedores
    navega para /?entity=notas&cnpjEmitente=... (o donut de imposto ancora em
    Impostos). Cursor/paginação e filtros existentes (q/status) preservados.
  acceptance_criteria: []
  labels:
    - area:api
    - area:dashboard
    - area:graph
    - tipo:feature
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T00:10:52.709Z'
---
# Drill-through Visão Geral → Explorer + filtros ufEmitente/cnpjEmitente (ponta a ponta)
