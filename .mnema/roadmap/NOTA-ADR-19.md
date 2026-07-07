---
mnema:
  key: NOTA-ADR-19
  kind: decision
  status: accepted
  title: >-
    Motor de alertas: persistente (:Alerta no Neo4j) + avaliação sob demanda +
    config global
  context: >-
    EPIC-27 (alertas proativos) precisa decidir: (a) como avaliar/persistir
    alertas e (b) escopo da config. O usuário delegou ambas ("faça o
    recomendado").
  decision: >-
    Alertas são persistidos como nós :Alerta no Neo4j com estado lido/não-lido
    (habilita badge de count e marcar-lido, exigidos por NOTA-184/185). A
    avaliação das regras é SOB DEMANDA via endpoint (POST /alerts/evaluate +
    avaliação preguiçosa), SEM job no worker neste ciclo — agendamento e dedup
    ficam como evolução futura. A config de regras/limiares é GLOBAL (uma por
    instância), coerente com a visão de ferramenta de análise (não
    multi-tenant), sem relação usuário↔config.
  rationale: null
  consequences: >-
    Prós: entrega lido/não-lido real e centro de notificações funcional sem a
    complexidade de scheduling/dedup no worker; sem migração multi-tenant.
    Contras: alertas só atualizam quando alguém dispara a avaliação (não é
    'tempo real' na ingestão) — mitigável depois com job no worker. Registrar
    observação para o EPIC futuro do job.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts: []
  metadata: {}
  at: '2026-07-07T18:39:54.851Z'
---
# Motor de alertas: persistente (:Alerta no Neo4j) + avaliação sob demanda + config global
