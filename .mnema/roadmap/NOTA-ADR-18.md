---
mnema:
  key: NOTA-ADR-18
  kind: decision
  status: proposed
  title: >-
    Reforma Tributária: leitura dos grupos IBS/CBS/IS sobre o leiaute v4.00
    existente (sem XSD novo)
  context: >-
    Usuário pediu suporte aos grupos/campos da reforma tributária. Investigação
    mostrou: (1) o notagrafo só lia ICMS/IPI/PIS/COFINS; (2) suspeita de
    precisar de XSD novo — mas a verificação do XSD em disco revelou que
    leiauteNFe_v4.00.xsd + DFeTiposBasicos_v1.00.xsd JÁ definem gIBSCBS (TCIBS),
    IBSCBSTot (TIBSCBSMonoTot), ISTot (TISTot) e campos
    vIBS/vIBSUF/vIBSMun/vCBS/vIS/pIBSUF/pIBSMun/pCBS/pIS/cClassTrib.
  decision: >-
    Suportar a Reforma Tributária (CBS, IBS-UF/Mun, IS) por LEITURA: extrair os
    grupos gIBSCBS (por item) e os totais IBSCBSTot/ISTot do XML, persistir no
    grafo como total_v* (vIBS, vIBSUF, vIBSMun, vCBS, vIS) e expor no dashboard
    (composição tributária, filtros, export) — como já é feito com
    ICMS/IPI/PIS/COFINS. NÃO calcular tributo (fora do escopo do notagrafo, que
    ANALISA NF-e). O XSD atual (leiauteNFe_v4.00 + DFeTiposBasicos_v1.00) JÁ
    contém os tipos da reforma (TCIBS/gIBSCBS, TIBSCBSMonoTot, TISTot), então a
    validação já cobre — não é preciso XSD novo nem nova versaoSchema (a NT
    2025.002 estende o leiaute 4.00, mantendo versão '4.00').
  rationale: >-
    Leitura (não cálculo) é coerente com o produto (BI de NF-e). Reusar o
    leiaute 4.00 existente evita depender de XSDs oficiais que não podem ser
    obtidos automaticamente e reflete a realidade da NT 2025.002 (estende o
    4.00). Modelar os totais como total_v* segue o padrão já usado (achatamento
    no nó NotaFiscal), reaproveitando as queries de stats.
  consequences: >-
    Parser passa a ler gIBSCBS/IBSCBSTot/ISTot de forma tolerante (opcionais —
    NF-e pré-reforma não têm). Novos total_vIBS/vIBSUF/vIBSMun/vCBS/vIS no
    grafo. tax.queries agrega os novos tributos. Dashboard: composição
    tributária, filtros e export ganham IBS/CBS/IS. Seed de demo pode gerar NF-e
    com o grupo para teste. Se a SEFAZ publicar versão de schema distinta no
    futuro, o xsd.registry (já versionado por diretório) acomoda.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/core/src/types/nf.types.ts
    - packages/core/src/parser/nfe.parser.ts
    - packages/graph/src/nf.repository.ts
    - packages/graph/src/queries/tax.queries.ts
    - packages/dashboard/src/pages/Overview.tsx
    - packages/dashboard/src/pages/explorer/ExplorerImpostos.tsx
    - packages/dashboard/src/pages/Exports.tsx
  metadata: {}
  at: '2026-07-07T15:07:45.870Z'
---
# Reforma Tributária: leitura dos grupos IBS/CBS/IS sobre o leiaute v4.00 existente (sem XSD novo)
