---
mnema:
  key: NOTA-62
  state: IN_REVIEW
  title: 'Fase 4b — Dashboard: página/aba de Impostos'
  description: >-
    Nova página Impostos (rota /impostos) consumindo GET /stats/impostos (Fase
    3b): KPIs por tributo (ICMS/IPI/PIS/COFINS/ICMS-ST/FCP), série temporal da
    carga tributária (Recharts LineChart) e tabelas Top NCM e Top CFOP por
    imposto. Hook useTaxStats em api/hooks.ts. Item no Sidebar e rota no
    router.tsx. i18n pt-BR/en. Estados loading/erro/vazio como nas demais
    páginas.
  acceptance_criteria:
    - >-
      Rota /impostos renderiza KPIs por tributo, série temporal e rankings Top
      NCM/CFOP a partir do endpoint /stats/impostos
    - >-
      Entrada no Sidebar e navegação funcionando; estados loading/erro/vazio
      tratados como nas demais páginas
    - i18n pt-BR/en; build/lint e testes verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:23.058Z'
---
# Fase 4b — Dashboard: página/aba de Impostos
