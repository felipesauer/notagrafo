---
mnema:
  key: NOTA-77
  state: IN_REVIEW
  title: >-
    NFList: colunas chave de acesso (copiável), destinatário e Ações (.plan/03
    §4)
  description: >-
    A tabela de NFList.tsx tem só 5 colunas (número, emitente, valor, status,
    emissão). O .plan/03 §4 pede também: chave de acesso truncada e copiável (1ª
    coluna), destinatário, e coluna Ações com ti-eye (ver) e ti-download (baixar
    XML).
  acceptance_criteria:
    - Coluna chave de acesso truncada com ação de copiar a chave completa
    - Coluna destinatário
    - >-
      Coluna Ações: ver detalhe (ti-eye) e baixar XML (ti-download, GET
      /nf/:chave/xml)
    - i18n pt-BR e en; typecheck/lint/build verdes; e2e não regride
  labels:
    - area:dashboard
    - origem:auditoria-3
    - tipo:gap
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T17:51:20.326Z'
---
# NFList: colunas chave de acesso (copiável), destinatário e Ações (.plan/03 §4)
