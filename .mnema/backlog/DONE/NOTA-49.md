---
mnema:
  key: NOTA-49
  state: DONE
  title: Investigar/estabilizar o alert de erro no login (e2e auth)
  description: >-
    Bug e2e (auditoria 2): auth.spec.ts 'login com credenciais inválidas mostra
    erro inline' falhou esperando role=alert. O Login.tsx tem role=alert, então
    investigar: (a) o backend retorna 401 para o usuário demo com senha errada?
    (b) há timing/await faltando no spec ou no setErro? Corrigir a causa e
    estabilizar o teste.
  acceptance_criteria:
    - Causa raiz identificada (backend 401 vs render do alert vs timing)
    - Login com senha errada exibe o alert de erro de forma deterministica
    - auth.spec.ts passa contra o stack docker
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T02:35:56.010Z'
---
# Investigar/estabilizar o alert de erro no login (e2e auth)
