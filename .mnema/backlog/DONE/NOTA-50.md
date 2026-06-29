---
mnema:
  key: NOTA-50
  state: DONE
  title: Renomear identificadores PT→EN no pacote @notagrafo/core
  description: >-
    Padronizar para inglês os identificadores de LÓGICA DE CÓDIGO do pacote
    `packages/core` (parser/validador/utils), mantendo intactos os campos de
    domínio NF-e que espelham a nomenclatura SEFAZ e o contrato.


    Renomear (exemplos identificados na varredura):

    - `validarNFe` → `validateNFe` (nfe.validator.ts:50) — EXPORTADA, consumida
    por api/worker; acompanhar consumidores.

    - `extrairVersao` → `extractVersion` (nfe.validator.ts:34)

    - `extrairChave` → `extractAccessKey` (nfe.parser.ts:101)

    - `buscarValor` → `findValue`/`readValue` (nfe.parser.ts:116)

    - `extrairTributos` → `extractTaxes` (nfe.parser.ts:130)

    - `parseEmpresa` → `parseCompany` (nfe.parser.ts:221) e o param `isEmit`
    pode permanecer (espelha XML `emit`).

    - `resolveIdUnico` → `resolveUniqueId` (produto.utils.ts) — EXPORTADA.

    - Renomear arquivos: `produto.utils.ts` → `product.utils.ts`; avaliar
    `nf.types.ts` → manter (tipos de domínio) mas pode virar `nf.types.ts`
    (sigla NF aceita). `nfe.parser.ts`/`nfe.validator.ts`: NFe é sigla de
    domínio, manter.

    - Comentários em PT podem ficar em PT (idioma de conversa do projeto) — foco
    é identificador. Não traduzir comentários a menos que sobre código renomeado
    para evitar inconsistência.


    NÃO MEXER: interfaces de domínio
    `NotaFiscalNode`/`EmpresaNode`/`ProdutoNode`/`ContemEdge` e seus campos
    (`chaveAcesso`, `razaoSocial`, `valorTotal`, `cnpjEmitente`, `dataEmissao`,
    etc.); enums `NFStatus`/`NFTipo`/etc. e seus valores
    (`'ativa'|'cancelada'`); nomes de tags XML; constante `SEM_GTIN` (valor
    sentinela SEFAZ). Esses formam o contrato da API (.plan/) e o schema do
    grafo.


    Atualizar todos os imports/usos nos demais pacotes e nos testes que
    referenciam os símbolos renomeados.
  acceptance_criteria:
    - >-
      Funções internas e exportadas do core com nome em PT estão renomeadas para
      inglês (validarNFe→validateNFe, extrairVersao, extrairChave, buscarValor,
      extrairTributos, parseEmpresa, resolveIdUnico)
    - >-
      Arquivo produto.utils.ts renomeado para product.utils.ts (ou equivalente
      em inglês) com imports atualizados
    - >-
      Campos de domínio NF-e (chaveAcesso, razaoSocial, valorTotal,
      cnpjEmitente, etc.), interfaces *Node/*Edge, enums de status e o sentinela
      SEM_GTIN permanecem inalterados
    - >-
      Todos os consumidores de símbolos exportados renomeados (api, worker,
      dashboard) foram atualizados
    - >-
      pnpm build, typecheck e lint passam; test:unit e test:integration
      permanecem verdes; testes que citam os identificadores antigos foram
      atualizados
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-10
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T15:20:39.724Z'
---
# Renomear identificadores PT→EN no pacote @notagrafo/core
