---
mnema:
  key: NOTA-70
  state: IN_REVIEW
  title: Cobrir NFref múltiplo (array) com teste no parser de NFe
  description: >-
    Achado A4 da auditoria. O parser trata NFref como objeto único OU array
    (nfe.parser.ts:205), mas o teste (nfe.parser.test.ts:158-168) e o fixture só
    exercitam 1 refNFe e o caso vazio. O ramo array (múltiplos NFref) fica sem
    cobertura; o XMLParser não força NFref como array (só 'det'). Adicionar
    teste com XML inline contendo 2+ NFref/refNFe verificando que
    parseNFe().referencias retorna todas as chaves.
  acceptance_criteria:
    - >-
      Teste cobre NFe com 2+ NFref/refNFe e verifica que referencias retorna
      todas as chaves
    - O caso objeto-único (1 refNFe) e o caso vazio continuam cobertos
    - test:unit verde (core)
  estimate: 1
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T17:57:07.278Z'
---
# Cobrir NFref múltiplo (array) com teste no parser de NFe
