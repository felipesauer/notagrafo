---
mnema:
  key: NOTA-205
  state: DONE
  title: 'Sec: helmet + rate-limit dedicado no login + validação de credenciais'
  description: >-
    Endurecimentos da API: (1) @fastify/helmet (headers de segurança); (2)
    rate-limit dedicado 10/min em /auth/login e /auth/register (vs global
    100/min); (3) format:email + senha minLength 8 no register/login
    (ajv-formats habilitado no Fastify 5); (4) failedReason do job sanitizado
    (só erros de negócio conhecidos ao cliente, resto genérico + log).
  acceptance_criteria:
    - '@fastify/helmet registrado (headers presentes)'
    - rate-limit dedicado em /auth/login e /auth/register
    - register/login validam format email e senha mínima
    - job.failedReason não vaza detalhe interno ao cliente
    - testes unit/integração continuam verdes
  labels:
    - area:api
    - dim:seguranca
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:11:20.648Z'
---
# Sec: helmet + rate-limit dedicado no login + validação de credenciais
