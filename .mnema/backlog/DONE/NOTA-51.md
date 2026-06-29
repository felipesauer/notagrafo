---
mnema:
  key: NOTA-51
  state: DONE
  title: Renomear identificadores PT→EN no pacote @notagrafo/graph
  description: >-
    Padronizar para inglês os identificadores de LÓGICA DE CÓDIGO do pacote
    `packages/graph` (repository + queries + driver), mantendo intactos os
    labels e propriedades do Neo4j e os campos de domínio NF-e.


    Renomear (exemplos da varredura):

    - `serializarNota` → `serializeInvoice`/`serializeNF` (nf.repository.ts:39)

    - `mergeNotaFiscal` → `mergeInvoice` (nf.repository.ts:57) — EXPORTADA,
    consumida pelo worker.

    - `countNotasFiscais` → `countInvoices` (nf.queries.ts:139) — EXPORTADA.

    - `listNotasFiscais` → `listInvoices` (nf.queries.ts:157) — EXPORTADA.

    - `getNotaFiscal` → `getInvoice` (nf.queries.ts:232) — EXPORTADA.

    - `getEmpresaStats` → `getCompanyStats` (empresa.queries.ts:55) — EXPORTADA.

    - `getEmpresaGrafo` → `getCompanyGraph` (empresa.queries.ts:86) — EXPORTADA,
    consumida pela api.

    - `topProdutos` → `topProducts` (produto.queries.ts:43);
    `historicoPrecoProduto` → `productPriceHistory` (produto.queries.ts:95) —
    EXPORTADAS, consumidas pela api.

    - Tipos auxiliares de retorno/parâmetro com nome PT (ex.:
    `NotaFiscalParaGravar`) → inglês (ex.: `InvoiceToPersist`).

    - Renomear arquivos: `empresa.queries.ts`→`company.queries.ts`,
    `produto.queries.ts`→`product.queries.ts`, `nf.queries.ts`→manter (NF é
    sigla aceita) ou `invoice.queries.ts`;
    `nf.repository.ts`→`invoice.repository.ts` ou manter sigla NF — escolher um
    padrão e aplicar consistentemente.


    NÃO MEXER: queries Cypher quanto a labels/propriedades do grafo
    (`(u:Usuario)`, `:NotaFiscal`, `:Empresa`, `:Produto`, propriedades como
    `chaveAcesso`, `razaoSocial`, etc.) — isso é o schema persistido. Só
    renomear variáveis JS/TS e nomes de função em volta das queries, não o texto
    Cypher que referencia o banco.


    Depende de NOTA-50 (core) por causa de tipos/símbolos importados do core.
    Atualizar consumidores na api e os testes (unit fake-driver + integração).
  acceptance_criteria:
    - >-
      Funções do graph com nome em PT renomeadas para inglês (serializarNota,
      mergeNotaFiscal, countNotasFiscais, listNotasFiscais, getNotaFiscal,
      getEmpresaStats, getEmpresaGrafo, topProdutos, historicoPrecoProduto)
    - 'Tipos auxiliares PT (ex.: NotaFiscalParaGravar) renomeados para inglês'
    - >-
      Arquivos empresa.queries.ts/produto.queries.ts renomeados para inglês com
      imports atualizados; padrão de nome consistente no pacote
    - >-
      Labels e propriedades Neo4j dentro das queries Cypher permanecem
      inalterados (schema do grafo intacto)
    - >-
      Consumidores na api atualizados; pnpm build/typecheck/lint passam;
      test:unit (fake-driver) e test:integration verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-10
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T15:20:50.419Z'
---
# Renomear identificadores PT→EN no pacote @notagrafo/graph
