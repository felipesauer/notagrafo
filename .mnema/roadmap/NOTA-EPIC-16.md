---
mnema:
  key: NOTA-EPIC-16
  kind: epic
  state: CLOSED
  title: >-
    Análise de rede — fluxo fiscal (Nivo) e exploração da rede completa
    (Reagraph)
  description: >-
    Fase 4: duas features de análise de dados que a stack atual não cobre, ambas
    full-stack (nova query no @notagrafo/graph + rota na API + tela no
    dashboard). (1) Fluxo fiscal com Nivo: sankey/heatmap do fluxo de valor
    emitente→destinatário agregado de toda a base (GET /stats/fluxo novo) —
    revela concentração e dependência comercial. (2) Rede completa com Reagraph
    (WebGL): tela que carrega o grafo inteiro da base (GET /rede novo), com
    layout de força, detecção de comunidades e busca de caminho — complementar
    ao ego-graph do React Flow (que continua no detalhe/página atual). Nivo e
    Reagraph COEXISTEM com Recharts/React Flow, não substituem. Pode alterar
    api/graph.
  metadata: {}
  created_at: '2026-07-03T15:50:30.241Z'
  closed_at: '2026-07-03T22:00:20.677Z'
---
# Análise de rede — fluxo fiscal (Nivo) e exploração da rede completa (Reagraph)
