---
mnema:
  key: NOTA-167
  state: DONE
  title: 'Dashboard: aba Perfil editável (nome/email/senha)'
  description: >-
    PerfilCard em Configurações: edita nome/email (PATCH /auth/me + setSession)
    e troca senha (PATCH /auth/password, atual+nova+confirmar). Botão 'Alterar
    senha' deixa de ser disabled. Toast de feedback. i18n pt-BR/en. Validado E2E
    (relogin com credenciais novas persiste).
  acceptance_criteria:
    - Alterar nome/email persiste e atualiza a sessão
    - Alterar senha funciona com validação da atual
    - Botão deixa de ser disabled
    - i18n pt-BR/en
  labels:
    - auth
    - dashboard
    - ux
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:25:19.410Z'
---
# Dashboard: aba Perfil editável (nome/email/senha) em Configurações
