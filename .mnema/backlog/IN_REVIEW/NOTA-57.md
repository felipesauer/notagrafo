---
mnema:
  key: NOTA-57
  state: IN_REVIEW
  title: >-
    Fase 1b — Repository: gravar CANCELA/DEVOLVE, totais e catálogo NCM/CFOP
    (graph)
  description: >-
    Atualizar packages/graph/src/nf.repository.ts (mergeInvoice /
    InvoiceToPersist): (1) gravar aresta DEVOLVE (NotaFiscal->NotaFiscal por
    chaveRefNF) quando finalidade='devolucao' e houver referencias, via MERGE
    idempotente, criando a NF-alvo como nó stub (só chaveAcesso) se não existir;
    (2) persistir os novos campos fiscais da aresta CONTÉM (já vêm do parser via
    spread); (3) popular descricao/secao/capitulo no MERGE do NCM e
    descricao/tipo/natureza no MERGE do CFOP via lookupNcm/lookupCfop do core
    (Fase 0); (4) gravar os totais da NF como propriedades do nó NotaFiscal
    (performance de stats). Worker não precisa mudar (já faz {...parsed, raw}).
    InvoiceToPersist ganha totais e referencias.
  acceptance_criteria:
    - >-
      Reprocessar uma NF de devolução cria aresta (:NotaFiscal)-[:DEVOLVE
      {chaveRefNF}]->(:NotaFiscal) idempotente (MERGE, sem duplicar)
    - >-
      Nós NCM e CFOP passam a ter descricao (e tipo/natureza p/ CFOP) populados
      via catálogo no merge
    - >-
      Novos campos fiscais da aresta CONTÉM e os totais da NF são gravados;
      testes de integração do repository (Testcontainers) cobrem devolução,
      catálogo e totais; build/typecheck/lint verdes
  estimate: 8
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:03.755Z'
---
# Fase 1b — Repository: gravar CANCELA/DEVOLVE, totais e catálogo NCM/CFOP (graph)
