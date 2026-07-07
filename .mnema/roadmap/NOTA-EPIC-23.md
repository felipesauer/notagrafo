---
mnema:
  key: NOTA-EPIC-23
  kind: epic
  state: OPEN
  title: >-
    Perfil e conta: cadastro (register) + edição de nome/email/senha (sair do
    modo demo)
  description: >-
    Hoje não há conceito de perfil editável nem cadastro: o Usuario tem só
    id/email/nome/senhaHash, a auth é binária, o usuário demo vem do seed e o
    botão 'Alterar senha' na tela de Configurações está desabilitado
    (placeholder). O 'modo demo' é flag de env (DEMO/DEMO_AUTH_ENABLED). Usuário
    pediu: (1) tela de cadastro para criar conta própria (POST /auth/register,
    expondo o createUser que já existe no repo); (2) edição do perfil do usuário
    logado — nome, email e senha — reemitindo o JWT quando nome/email mudam
    (estão nos claims). Backend: novas rotas /auth/register + PATCH /auth/me
    (nome/email) + PATCH /auth/password; novos métodos no user.repository
    (updateProfile com unicidade de email, updatePassword validando a atual).
    Dashboard: tela de cadastro, e a aba Perfil de Configurações vira editável.
    i18n pt-BR/en. Testes de rota + repo.
  metadata: {}
  created_at: '2026-07-07T14:07:46.412Z'
  closed_at: null
---
# Perfil e conta: cadastro (register) + edição de nome/email/senha (sair do modo demo)
