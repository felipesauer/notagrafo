---
mnema:
  key: NOTA-EPIC-29
  kind: epic
  state: OPEN
  title: 'Reformulação Docker/DX: imagens enxutas, comandos claros, dev ágil'
  description: >-
    O setup Docker atual está pesado, lento e conflitante (feedback do usuário).
    Diagnóstico: (1) imagens gordas — api 575MB, worker 514MB, seed 511MB —
    porque o stage production copia /app inteiro (node_modules de build com
    devDeps + toolchain nativo libxmljs2); build recompila core/graph em cada
    Dockerfile (trabalho 2-3x); (2) comandos confusos — `pnpm dev` mistura
    docker+host; sem comando dedicado p/ stack app (precisa lembrar `--profile
    app up --build`); `docker:down` não fecha a infra (portas presas); (3)
    subida lenta — neo4j (JVM ~30s) é o gargalo; worker replicas:2 em dev.
    Decisões do usuário: escopo COMPLETO (Dockerfiles+comandos+orquestração);
    modo dev = infra no Docker + app no host (hot-reload), com um comando
    separado p/ stack completa containerizada (E2E/demo). Stack: pnpm 10.34
    (deploy --prod disponível), Compose v5.3, buildx v0.35 (bake disponível).
    Entrega em PRs pequenos, cada um verde (build das imagens + compose up +
    smoke test).
  metadata: {}
  created_at: '2026-07-08T13:29:47.141Z'
  closed_at: null
---
# Reformulação Docker/DX: imagens enxutas, comandos claros, dev ágil
