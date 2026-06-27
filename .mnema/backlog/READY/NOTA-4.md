---
mnema:
  key: NOTA-4
  state: READY
  title: .env.example com todas as variáveis
  description: >-
    Criar .env.example com todas as variáveis documentadas com comentários
    (seção 'Variáveis de ambiente' do 00 visao-geral.md). Ajustar para Auth JWT
    manual (ADR NOTA-ADR-1): manter AUTH_SECRET/AUTH_JWT_EXPIRES_IN; marcar
    SMTP/magic-link como futuras. Nunca commitar .env real.
  acceptance_criteria:
    - >-
      .env.example cobre DEMO, Neo4j, Redis/BullMQ, Storage, API, Auth,
      Exportação, LGPD e Observabilidade
    - Cada variável com comentário
    - Variáveis de Auth refletem JWT manual (ADR NOTA-ADR-1)
    - .gitignore ignora .env
  estimate: 1
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:06.463Z'
---
# .env.example com todas as variáveis
