---
mnema:
  key: NOTA-205
  state: DRAFT
  title: 'Sec: helmet + rate-limit dedicado no login + validação de credenciais'
  description: >-
    Endurecimentos de segurança da API (nenhum é vulnerabilidade crítica
    isolada, agrupados por afinidade — mas mantidos separados dos fixes de
    correção): (1) @fastify/helmet ausente — sem
    X-Content-Type-Options/X-Frame-Options/CSP; adicionar (beneficia também o
    /docs). (2) rate-limit é global (100/min) sem teto dedicado para /auth/login
    e /auth/register — brute-force de credencial compartilha o teto geral;
    adicionar limite estrito nessas rotas. (3) /auth/register valida email só
    por minLength:3 (sem format:email) e senha minLength:6
    (auth.routes.ts:137-138); endurecer. (4) job.failedReason do BullMQ
    devolvido cru ao cliente em nf.routes.ts:119 — sanitizar/mapear. (5) avaliar
    trustProxy no Fastify se atrás de proxy (rate-limit por IP).
  acceptance_criteria:
    - '@fastify/helmet registrado'
    - rate-limit mais estrito em /auth/login e /auth/register
    - register valida format email e política de senha razoável
    - job.failedReason não exposto cru ao cliente
    - testes e2e/integração de auth continuam verdes
  labels:
    - area:api
    - dim:seguranca
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:11.290Z'
---
# Sec: helmet + rate-limit dedicado no login + validação de credenciais
