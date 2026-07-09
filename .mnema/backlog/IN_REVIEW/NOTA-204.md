---
mnema:
  key: NOTA-204
  state: IN_REVIEW
  title: 'Harden: opções explícitas de segurança no parseXml do validador (XXE/DTD)'
  description: >-
    validateNFe chamava libxmljs2 parseXml(xml) sem opções. Verificado que a
    versão atual já é segura, mas a segurança fica presa ao default. Passar {
    noent:false, dtdload:false, dtdvalid:false, nonet:true, huge:false }
    explicitamente + teste de entity-bomb/DTD externo. Defesa-em-profundidade,
    não vulnerabilidade ativa.
  acceptance_criteria:
    - parseXml do input recebe opções explícitas desabilitando DTD/net/entidades
    - >-
      teste com billion-laughs e DTD externo confirmando
      não-expansão/não-vazamento
    - validação de XML legítimo continua passando
  labels:
    - area:core
    - dim:seguranca
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:00:23.291Z'
---
# Harden: opções explícitas de segurança no parseXml do validador (XXE/DTD)
