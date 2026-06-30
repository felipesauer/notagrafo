---
mnema:
  key: NOTA-65
  state: IN_REVIEW
  title: Fase 6 — Atualizar docs .plan e ADR do modelo fiscal/agregação
  description: >-
    Atualizar .plan/01 (catálogo NCM/CFOP, totais total_* no nó NotaFiscal,
    DEVOLVE via NFref implementada / CANCELA ainda fora, campos fiscais
    ampliados da aresta CONTÉM) e .plan/02 (novos endpoints /stats/impostos,
    /stats/produto/:id/empresas, filtros fiscais do GET /nf, forma final do
    detalhe com tributos/totais/cfop). Registrar ADR (decision_record) da
    decisão 'impostos na aresta + agregação por query, sem nós de CST nesta
    fase'. Atualizar memória de planejamento.
  acceptance_criteria:
    - >-
      .plan/01 e .plan/02 refletem o modelo e os contratos novos; sem
      divergência com o código entregue
    - >-
      ADR registrado (decision_record) explicando a escolha do modelo fiscal e o
      que ficou fora (nós de CST, CBS/IBS/IS)
    - Memória de planejamento atualizada apontando o EPIC-11 e suas entregas
  estimate: 3
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:29.014Z'
---
# Fase 6 — Atualizar docs .plan e ADR do modelo fiscal/agregação
