---
mnema:
  key: NOTA-211
  state: DONE
  title: 'Fix: rate-limit de login (10/min) quebra a suíte e2e no CI — elevar teto'
  description: >-
    Regressão do NOTA-205 (#86): rate-limit dedicado de 10/min em /auth/login
    estoura a suíte e2e (~16-19 logins do mesmo IP + retries em <1min → 429 →
    'An error occurred.' → waitForURL estoura). Confirmado no CI (nf-list:25,
    overview:5) e reproduzido local (11º login → 429). Elevar o default para
    60/min (ainda estrito vs global 100, inviabiliza brute-force, cobre a suíte
    com folga), configurável por env.
  acceptance_criteria:
    - teto de /auth/login e /auth/register elevado (>= logins da suíte + folga)
    - continua estrito vs global e configurável por env
    - suíte e2e COMPLETA passa contra a stack
    - unit/integração/lint/typecheck verdes
  labels:
    - area:api
    - dim:seguranca
    - tipo:bug
  depends_on: []
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T20:37:05.119Z'
---
# Fix: rate-limit de login (10/min) quebra a suíte e2e no CI — elevar teto
