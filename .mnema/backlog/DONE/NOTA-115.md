---
mnema:
  key: NOTA-115
  state: DONE
  title: Drill-through Visão Geral → Explorer + filtros ufEmitente/cnpjEmitente
  description: >-
    Cross-filter/drill-through da Visão Geral para o Explorer filtrado. Backend
    já suportava ufEmitente/cnpjEmitente; trabalho foi só frontend:
    validateSearch da rota /, repasse a useNFList, chip removível, cliques nos
    visuais da Visão Geral, e reconciliação de 4 deep-links /nf quebrados.
  acceptance_criteria:
    - >-
      Clique em barra de UF e em fornecedor na Visão Geral abre o Explorer
      filtrado de verdade
    - >-
      validateSearch da rota / e useNFList aceitam
      ufEmitente/cnpjEmitente/ncm/comImposto
    - Chip removível do filtro ativo
    - Deep-links /nf reconciliados para / filtrado
    - build/lint/e2e verdes + screenshots
  labels:
    - area:api
    - area:dashboard
    - area:graph
    - tipo:feature
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T00:30:15.727Z'
---
# Drill-through Visão Geral → Explorer + filtros ufEmitente/cnpjEmitente (ponta a ponta)
