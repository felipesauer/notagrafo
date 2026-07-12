---
mnema:
  key: NOTA-202
  state: DONE
  title: 'Fix: parser aceita chaveAcesso malformada'
  description: >-
    extractAccessKey (nfe.parser.ts) fazia apenas id.replace(/^NFe/,''),
    aceitando @Id malformado como identidade da NF (confirmado: 'NFeABC'→chave
    'ABC'). Validar 44 dígitos numéricos, lançando NFeParseError. Decisão (com
    usuário): só estrutura, sem DV mod-11 — coerente com o XSD e o escopo de
    analisar NF-e já autorizadas.
  acceptance_criteria:
    - >-
      parseNFe lança NFeParseError para @Id sem 44 dígitos ou com dígitos
      inválidos
    - mensagem de erro acionável
    - >-
      testes unit cobrindo chave curta, não-numérica e 43 dígitos (falhariam sem
      o fix)
    - fixtures existentes continuam válidas (44 dígitos aceitos sem exigir DV)
  labels:
    - area:core
    - dim:correcao
    - tipo:bug
  depends_on: []
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-12T20:51:56.576Z'
---
# Fix: parser aceita chaveAcesso malformada; DV mod-11 nunca conferido
