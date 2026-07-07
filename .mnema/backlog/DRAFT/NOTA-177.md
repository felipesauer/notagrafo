---
mnema:
  key: NOTA-177
  state: DRAFT
  title: Exibir CST/cClassTrib da Reforma no detalhe da NF
  description: >-
    O backend já extrai e getInvoice já coleta a aresta CONTÉM com
    cstIBSCBS/cClassTrib + valores IBS/CBS/IS por item. Falta EXIBIR no detalhe
    da NF (NFDetail): na tabela de itens, mostrar CST/cClassTrib da reforma e os
    valores IBS/CBS/IS por item (quando presentes). i18n. Menor — só
    apresentação.
  acceptance_criteria:
    - >-
      Tabela de itens do detalhe mostra CST/cClassTrib da reforma quando
      presente
    - Valores IBS/CBS/IS por item visíveis
    - Não polui itens de NF pré-reforma (condicional)
    - i18n pt-BR/en
  labels:
    - dashboard
    - fiscal
    - reforma
  estimate: 2
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:40:49.417Z'
---
# Exibir CST/cClassTrib da Reforma no detalhe da NF
