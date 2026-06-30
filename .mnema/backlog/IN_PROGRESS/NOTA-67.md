---
mnema:
  key: NOTA-67
  state: IN_PROGRESS
  title: >-
    Excluir NFs stub e devoluções nas queries de produto
    (topProducts/productCompanies)
  description: >-
    Achado A1 da auditoria de integridade (2026-06-30).
    packages/graph/src/queries/product.queries.ts: topProducts (l.71) e
    productCompanies (l.146-153) NÃO excluem NFs stub (status IS NULL, criadas
    via DEVOLVE quando a origem ainda não foi importada) nem devoluções
    (finalidade='devolucao'), ao contrário de tax.queries.ts (buildTaxWhere
    l.85-86, comentário F1/F3). Como o seed gera devoluções (~1/7 das notas) que
    criam stubs, os rankings de produto e o cruzamento produto↔empresa contam
    itens estornados/inertes, divergindo das stats fiscais. Aplicar o mesmo
    filtro `nf.status IS NOT NULL AND coalesce(nf.finalidade,'') <> 'devolucao'`
    nas duas queries, mantendo consistência com tax.queries. Cobrir com teste
    (unit via fake-driver e/ou integração) que prove a exclusão.
  acceptance_criteria:
    - topProducts exclui NFs com status IS NULL e finalidade='devolucao'
    - >-
      productCompanies (ambos os ramos do UNION) excluem NFs com status IS NULL
      e finalidade='devolucao'
    - >-
      Comportamento consistente com tax.queries.ts (mesma semântica de
      stub/devolução)
    - >-
      Teste cobre o cenário de produto presente em devolução/stub, provando que
      não entra no ranking/cruzamento
    - typecheck, lint e test:unit verdes
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T16:13:08.205Z'
---
# Excluir NFs stub e devoluções nas queries de produto (topProducts/productCompanies)
