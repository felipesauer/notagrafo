---
mnema:
  key: NOTA-201
  state: DONE
  title: 'Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics'
  description: >-
    O filtro F1/F3 (coalesce(nf.finalidade,'')<>'devolucao' e status IS NOT
    NULL) é aplicado em tax/product/duplicate mas NÃO em: flow.queries
    getFluxoEmpresas e getRedeGlobal arestas; alert.rules ruleHighValue,
    ruleSupplierConcentration, ruleVolumeSpike; company.queries getCompanyStats
    e getCompanyGraph nós/arestas; graph.metrics
    getCentrality/getUndirectedEdges. Efeito: devoluções contam como transação
    comercial — inflam Sankey/rede, disparam alertas e distorcem centralidade.
    Extrair um predicado reutilizável e aplicar de forma consistente. Exceção
    intencional: numbering-gaps mantém devolução (numera).
  acceptance_criteria:
    - >-
      predicado de NF ativa (exclui stub e devolução) reutilizável e aplicado em
      flow/alert/company/graph.metrics
    - getRedeGlobal coerente entre nós e arestas
    - getCompanyStats coerente com o ramo notas de getCompanyGraph
    - >-
      alertas high_value/supplier_concentration/volume_spike não disparam por
      devolução
    - >-
      testes que falhariam sem o fix (unit fake-driver conferindo o WHERE +
      integração com devolução na base)
    - documentar no código as exceções intencionais (numbering-gaps)
  labels:
    - area:graph
    - dim:correcao
    - tipo:bug
  depends_on: []
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-12T20:50:35.654Z'
---
# Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics
