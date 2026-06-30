---
mnema:
  key: NOTA-72
  state: IN_REVIEW
  title: >-
    pnpm dev: aguardar Neo4j healthy (--wait) e documentar porta 5173 do
    dashboard no modo dev
  description: >-
    pnpm dev falhava: api/worker/seed com 'Connection closed by server' do Neo4j
    + localhost:8080 não abria. (1) Corrida de boot: script `dev` faz `docker
    compose up -d && ...` sem esperar o Neo4j healthy; o Bolt do Neo4j community
    demora >30s e seed/packages disparam antes. Confirmado: com Neo4j healthy,
    dev:seed roda 40/40 NFes 0 falhas. O compose já tem healthcheck do neo4j;
    fix = `docker compose up -d --wait`. (2) No modo pnpm dev o dashboard é Vite
    em localhost:5173, não 8080 (8080 só no --profile app); README só cita 8080.
  acceptance_criteria:
    - >-
      Script `dev` usa `docker compose up -d --wait` antes de
      dev:libs/seed/packages
    - pnpm dev sobe sem erro de conexão do Neo4j
    - README documenta a 5173 no modo pnpm dev
    - Modo Docker completo (--profile app) segue na 8080 sem regressão
  estimate: 1
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-7
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:56:02.602Z'
---
# pnpm dev: aguardar Neo4j healthy (--wait) e documentar porta 5173 do dashboard no modo dev
