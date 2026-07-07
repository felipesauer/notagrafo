---
mnema:
  key: NOTA-175
  state: DRAFT
  title: Filtros por IBS/CBS no Explorer (recorte de NF sob a reforma)
  description: >-
    Estender o filtro fiscal do /nf. Hoje só existe comImposto (total_vICMS>0) e
    vICMSMin/Max. Adicionar: comReforma (coalesce(nf.total_vIBS,0)>0 OR
    total_vCBS>0) e, opcionalmente, vIBSMin/Max, vCBSMin/Max. Expor no NFFilters
    do Explorer (chips + popover) e no validateSearch da rota. i18n. Testes de
    query.
  acceptance_criteria:
    - Filtro 'com IBS/CBS' recorta NF-e sob a reforma
    - Exposto no Explorer (popover de filtros + chip ativo)
    - validateSearch aceita os novos parâmetros (linkável)
    - Testes de query
  labels:
    - dashboard
    - fiscal
    - graph
    - reforma
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:40:49.386Z'
---
# Filtros por IBS/CBS no Explorer (recorte de NF sob a reforma)
