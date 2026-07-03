---
mnema:
  key: NOTA-108
  state: DONE
  title: 'Rede completa com Reagraph: query + rota GET /rede + tela WebGL'
  description: >-
    Full-stack. (1) graph: query redeGlobal — todos os nós (empresas, opcional
    produtos) + arestas agregadas de toda a base, com limite de segurança. (2)
    API: GET /rede (schema + rota). (3) dashboard: instalar reagraph; nova
    tela/rota (ex.: /rede) com grafo WebGL — layout de força, detecção de
    comunidades (clusters coloridos), busca de caminho entre 2 empresas,
    controles. Item na sidebar. COEXISTE com o ego-graph do React Flow (que
    segue no detalhe e em /grafo). colorMode/tema. e2e: cobertura básica da nova
    rota.
  acceptance_criteria:
    - query redeGlobal no @notagrafo/graph + teste
    - GET /rede na API com schema + limite
    - tela Reagraph com layout de força + comunidades + busca de caminho
    - item na sidebar; build/lint/test:unit/e2e verdes
  labels:
    - area:api
    - area:dashboard
    - area:graph
    - tipo:feature
  estimate: 13
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-16
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:59:53.432Z'
---
# Rede completa com Reagraph: query + rota GET /rede + tela WebGL
