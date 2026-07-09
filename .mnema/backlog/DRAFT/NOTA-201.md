---
mnema:
  key: NOTA-201
  state: DRAFT
  title: 'Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics'
  description: >-
    O filtro F1/F3 (coalesce(nf.finalidade,'')<>'devolucao' e status IS NOT
    NULL) é aplicado em tax/product/duplicate mas NÃO em: flow.queries
    getFluxoEmpresas (:35-37) e getRedeGlobal arestas (:104-106); alert.rules
    ruleHighValue (:91), ruleSupplierConcentration (:121), ruleVolumeSpike
    (:157); company.queries getCompanyStats (:91-95) e getCompanyGraph
    nós/arestas (:145-171); graph.metrics getCentrality/getUndirectedEdges
    (:49,98). Efeito: devoluções contam como transação comercial — inflam
    Sankey/rede, disparam alertas de alto valor/concentração/spike, e distorcem
    centralidade/comunidades. Inconsistência INTERNA gritante: getRedeGlobal
    exclui stub nos nós mas não nas arestas; getCompanyGraph exclui no ramo
    notas (:214-215) mas não em stats. CONFIRMADO: base seed tem 7 devoluções
    ativas (valor até R$8.222) que hoje entram nessas agregações. Extrair um
    predicado reutilizável (ex.: buildActiveNFPredicate) e aplicar de forma
    consistente. Decidir caso a caso: numbering-gaps pode manter devolução
    (numera); period-comparison é discutível.
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:02.555Z'
---
# Fix: filtro devolução/stub inconsistente em flow/alert/company/graph.metrics
