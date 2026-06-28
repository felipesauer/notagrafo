---
mnema:
  key: NOTA-46
  state: READY
  title: Decidir destino de historicoPrecoProduto (expor ou remover)
  description: >-
    Achado G (BAIXA): historicoPrecoProduto existe no graph mas não é exposto
    por rota nem usado pelo dashboard. Decidir: (a) expor GET
    /stats/produto/:idUnico/historico + gráfico de preço, ou (b) remover a
    função e seu teste se fora de escopo do MVP. Registrar decisão.
  acceptance_criteria:
    - Decisao registrada (expor vs remover) com justificativa
    - >-
      Se expor: endpoint + hook + grafico de preco; se remover: funcao e teste
      retirados
    - Sem codigo morto remanescente
  estimate: 3
  priority: 4
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-28T22:07:31.165Z'
---
# Decidir destino de historicoPrecoProduto (expor ou remover)
