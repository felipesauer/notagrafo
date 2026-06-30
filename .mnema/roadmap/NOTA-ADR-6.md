---
mnema:
  key: NOTA-ADR-6
  kind: decision
  status: accepted
  title: >-
    Modelo fiscal: impostos na aresta CONTÉM + agregação por query (sem nós de
    CST/Imposto)
  context: >-
    O EPIC-11 precisou aprofundar as ligações fiscais do grafo (impostos,
    NCM/CFOP, devoluções) e expô-las na API e no dashboard. Havia duas formas de
    modelar os impostos: (a) mantê-los como propriedades escalares da aresta
    CONTÉM (como já era) e agregar por query; ou (b) promover CST/Imposto a nós
    próprios navegáveis no grafo. A escolha afeta migração de dados, custo de
    escrita por NF e a riqueza da exploração visual.
  decision: >-
    Manter os impostos por item como propriedades da aresta CONTÉM (vICMS,
    vBCICMS, pICMS, vBCST, vICMSST, vFCP, vICMSDeson, vIPI, vPIS, vCOFINS, vII,
    vISSQN, cst, cest) e gravar os totais da NF como propriedades total_* no nó
    NotaFiscal. As análises fiscais (por NCM, CFOP, UF, período, empresa) são
    feitas por QUERIES de agregação (tax.queries.ts:
    taxSummary/taxByNcm/taxByCfop), não por nós de CST/Imposto. NÃO criar nós
    :CST nem :Imposto nesta fase.
  rationale: >-
    A abordagem da aresta + agregação tem zero migração de dados (os impostos já
    viviam na aresta), escrita por NF inalterada e queries performáticas (totais
    a um sum(nf.total_*) de distância; agregação por NCM via CONTÉM). Promover
    CST/Imposto a nós exigiria nova migração, reprocessamento da base e mais
    escrita por NF, com ganho marginal para o caso de uso analítico (KPIs,
    séries, rankings) — que não precisa navegar 'todas as NFs com CST X' como
    entidade. Decidido com o Felipe em 2026-06-29.
  consequences: >-
    Os KPIs/séries/rankings fiscais saem de queries sobre total_* e CONTÉM.
    NCM/CFOP ganham catálogo estático (descricao/tipo/natureza). A aresta
    DEVOLVE é gravada a partir de ide/NFref/refNFe; CANCELA fica fora até haver
    ingestão de eventos de cancelamento da SEFAZ. Escopo de tributos permanece o
    do XSD vigente (ICMS, IPI, PIS, COFINS, II, ISSQN) — CBS/IBS/IS (Reforma EC
    132/2023) seguem fora, sem XSD oficial (reafirma a regra do 01 schema dados
    §tributos). Se no futuro for preciso explorar imposto como entidade
    navegável (ex.: grafo de CSTs), reavaliar promovê-lo a nó — exigirá migração
    + reprocessamento.
  superseded_by: null
  authored_by: 019f03ba-735c-725c-b52a-22a88c9abe61
  impacts:
    - packages/core/src/types/nf.types.ts
    - packages/core/src/parser/nfe.parser.ts
    - packages/core/src/catalog/ncm.catalog.ts
    - packages/core/src/catalog/cfop.catalog.ts
    - packages/graph/src/nf.repository.ts
    - packages/graph/src/queries/tax.queries.ts
    - packages/api/src/nf/nf.detail.ts
    - packages/api/src/routes/stats.routes.ts
    - .plan/01 schema dados.md
    - .plan/02 contratos api.md
    - NOTA-EPIC-11
  metadata: {}
  at: '2026-06-29T23:30:20.334Z'
---
# Modelo fiscal: impostos na aresta CONTÉM + agregação por query (sem nós de CST/Imposto)
