---
mnema:
  key: NOTA-56
  state: IN_REVIEW
  title: 'Fase 1a — Parser: extrair NFref e ampliar tributos (core)'
  description: >-
    Ampliar packages/core/src/parser/nfe.parser.ts: (1) extrair ide/NFref/refNFe
    → ParsedNF.referencias: string[]; (2) ampliar extractTaxes (ICMS-ST
    vBCST/vICMSST, FCP vFCP, vICMSDeson, CST/CSOSN string, CEST do produto); (3)
    extrair totais do grupo total/ICMSTot → ParsedNF.totais. Estender ContemEdge
    e adicionar TotaisNF em nf.types.ts. Escopo fiscal: só XSD vigente (ADR-3),
    sem CBS/IBS/IS. Inclui novos fixtures (ICMS normal+ST+FCP; devolução com
    refNFe).
  acceptance_criteria:
    - >-
      ParsedNF passa a conter `totais` (do grupo total/ICMSTot) e `referencias`
      (chaves de ide/NFref/refNFe, [] quando ausente)
    - >-
      ContemEdge inclui os novos campos fiscais (ICMS-ST, FCP, vICMSDeson,
      cst/csosn, cest) preenchidos quando presentes no XML, ausentes (sem null)
      quando não
    - >-
      Fixtures de teste cobrem: NF com ICMS-ST/FCP, NF de devolução com refNFe,
      NF sem NFref; testes do parser verdes; cobertura core >=90%
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:01.435Z'
---
# Fase 1a — Parser: extrair NFref e ampliar tributos (core)
