---
mnema:
  key: NOTA-59
  state: IN_REVIEW
  title: 'Fase 3a — API: tributos+totais+cfop no GET /nf/:chave (alinhar contrato)'
  description: >-
    Reformatar a resposta de GET /api/v1/nf/:chave para bater com o contrato
    .plan/02 l.351-370: por item, agrupar os campos fiscais sob `tributos` e
    aninhar produto.ncm{codigo,descricao}; incluir cfop{codigo,descricao} no
    topo; incluir bloco `totais` (vNF, vICMS, vIPI, vPIS, vCOFINS, vDesc,
    frete/seg/outros) a partir das props total_* da NF. Transformação em função
    pura testável. getInvoice (graph) passa a trazer o CFOP da NF (USA_CFOP).
    Atualizar nfDetailResponse (OpenAPI) para declarar tributos/totais/cfop.
  acceptance_criteria:
    - >-
      GET /nf/:chave retorna itens com objeto `tributos`
      (ICMS/IPI/PIS/COFINS/II/ISSQN), produto.ncm{codigo,descricao},
      cfop{codigo,descricao} e bloco `totais` conforme contrato
    - >-
      Schema OpenAPI (nfDetailResponse) documenta os novos campos; Swagger
      reflete a estrutura
    - >-
      Testes unit da rota (build-test-api + fake-driver) e integração cobrem a
      nova forma; build/typecheck/lint verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:12.828Z'
---
# Fase 3a — API: tributos+totais+cfop no GET /nf/:chave (alinhar contrato)
