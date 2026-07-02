---
mnema:
  key: NOTA-81
  state: DONE
  title: >-
    POST /auth/refresh: aceitar token recém-expirado (janela de 24h) conforme
    contrato
  description: >-
    O contrato (.plan/02) diz que o refresh aceita 'token ainda válido ou
    recém-expirado (janela de 24h)', mas auth.routes.ts:76 usa app.jwt.verify
    sem tolerância — qualquer token expirado recebe 401. Implementar a janela:
    verificar assinatura ignorando expiração e aceitar se exp estiver dentro das
    últimas 24h; recusar além disso.
  acceptance_criteria:
    - Token expirado há menos de 24h consegue refresh (200 com novo token)
    - Token expirado há mais de 24h recebe 401
    - Token com assinatura inválida continua 401
    - Testes unit/integração dos três cenários; typecheck/lint/unit verdes
  labels:
    - area:api
    - origem:auditoria-3
    - tipo:incoerencia
  estimate: 1
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T18:41:25.775Z'
---
# POST /auth/refresh: aceitar token recém-expirado (janela de 24h) conforme contrato
