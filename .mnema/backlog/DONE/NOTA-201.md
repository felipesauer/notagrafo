---
mnema:
  key: NOTA-201
  state: DONE
  title: 'Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics'
  description: >-
    O filtro F1/F3 (coalesce(nf.finalidade,'')<>'devolucao' e status IS NOT
    NULL) é aplicado em tax/product/duplicate mas NÃO em flow (getFluxoEmpresas
    :35-37, getRedeGlobal arestas :104-106), alert.rules (ruleHighValue :91,
    ruleSupplierConcentration :121, ruleVolumeSpike :157), company
    (getCompanyStats :91-95, getCompanyGraph nós/arestas :145-171) e
    graph.metrics (getCentrality/getUndirectedEdges :49,98). Devoluções contam
    como transação — inflam Sankey/rede, disparam alertas de alto
    valor/concentração/spike, distorcem centralidade/comunidades. CONFIRMADO:
    base seed tem 7 devoluções ativas (valor até R$8.222). Extrair predicado
    reutilizável e aplicar de forma consistente; documentar exceções
    intencionais.
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
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:43:56.531Z'
---
# Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics
