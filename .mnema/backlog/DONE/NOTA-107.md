---
mnema:
  key: NOTA-107
  state: DONE
  title: 'Fluxo fiscal com Nivo: query + rota GET /stats/fluxo + sankey/heatmap'
  description: >-
    Full-stack. (1) graph: query fluxoEmpresas — todos os pares
    emitente→destinatário agregados (de, para, razaoSocial de cada, totalNFs,
    valorTotal), com limite/top-N. (2) API: GET /stats/fluxo (schema + rota em
    stats.routes). (3) dashboard: instalar @nivo/core + @nivo/sankey (e
    @nivo/heatmap se couber); nova viz na página de Impostos ou Overview
    mostrando o fluxo de valor entre empresas — sankey (origem→destino,
    espessura=valor) com paleta tokenizada (--chart-*) e tema dark. Coexiste com
    Recharts. e2e não pode quebrar; adicionar cobertura básica se virar
    rota/página nova.
  acceptance_criteria:
    - query fluxoEmpresas no @notagrafo/graph + teste
    - GET /stats/fluxo na API com schema
    - sankey Nivo tokenizado (claro/escuro) com dados reais
    - build/lint/test:unit/e2e verdes
  labels:
    - area:api
    - area:dashboard
    - area:graph
    - tipo:feature
  estimate: 8
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-16
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:59:45.145Z'
---
# Fluxo fiscal com Nivo: query + rota GET /stats/fluxo + sankey/heatmap
