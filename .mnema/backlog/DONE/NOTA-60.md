---
mnema:
  key: NOTA-60
  state: DONE
  title: 'Fase 3b — API: GET /stats/impostos + filtros fiscais no GET /nf'
  description: >-
    stats.routes.ts: novo GET /stats/impostos (usa taxSummary/taxByNcm/taxByCfop
    da Fase 2) — totais por tributo, série temporal e top NCM/CFOP por imposto,
    querystring de período/UF documentada no OpenAPI; e GET
    /stats/produto/:idUnico/empresas (productCompanies). nf.queries + nf.routes:
    filtros fiscais no GET /nf (vICMSMin/Max, comImposto) refletidos em
    activeFilters e nfListQuerySchema.
  acceptance_criteria:
    - >-
      GET /stats/impostos retorna totais por tributo, série temporal e rankings
      por NCM/CFOP; querystring validada e documentada no Swagger
    - >-
      GET /nf aceita ao menos um filtro fiscal (ex.: vICMSMin/Max) refletido em
      meta.filtrosAtivos; GET /stats/produto/:idUnico/empresas retorna o
      cruzamento
    - Testes unit+integração das novas rotas/filtros verdes; cobertura api >=90%
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:49:21.692Z'
---
# Fase 3b — API: GET /stats/impostos + filtros fiscais no GET /nf
