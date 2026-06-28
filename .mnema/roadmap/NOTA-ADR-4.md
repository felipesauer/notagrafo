---
mnema:
  key: NOTA-ADR-4
  kind: decision
  status: accepted
  title: Expor historicoPrecoProduto via endpoint + gráfico no dashboard
  context: >-
    historicoPrecoProduto existe no graph (agrega preço médio por mês) mas não
    era exposto por nenhuma rota nem usado pelo dashboard — código sem
    consumidor (achado G da auditoria 2).
  decision: >-
    Expor via GET /api/v1/stats/produto/:idUnico/historico e renderizar um
    gráfico de evolução de preço no detalhe do produto (dashboard), em vez de
    remover. A função e os testes já existem e agregam valor analítico ao MVP.
  rationale: null
  consequences: >-
    Adiciona 1 endpoint, 1 hook e 1 gráfico Recharts. Mantém a feature pronta;
    sem código morto.
  superseded_by: null
  authored_by: 019f03ba-735c-725c-b52a-22a88c9abe61
  impacts: []
  metadata: {}
  at: '2026-06-28T23:09:01.247Z'
---
# Expor historicoPrecoProduto via endpoint + gráfico no dashboard
