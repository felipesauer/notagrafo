---
mnema:
  key: NOTA-164
  state: DONE
  title: 'Backend: user.repository — updateProfile + updatePassword'
  description: >-
    Adicionado ao user.repository: updateProfile(id, {nome?, email?}) com
    unicidade de email; updatePassword(id, senhaAtual, novaSenha) validando a
    atual via bcrypt. Testes unit (fake driver): sucesso, email duplicado, senha
    atual errada.
  acceptance_criteria:
    - updateProfile atualiza nome/email e rejeita email duplicado
    - updatePassword valida senha atual antes de trocar
    - Testes unit cobrindo sucesso + erros
  labels:
    - api
    - auth
    - backend
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:25:11.902Z'
---
# Backend: user.repository — updateProfile (nome/email, unicidade) + updatePassword (valida atual)
