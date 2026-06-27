---
mnema:
  key: NOTA-26
  state: DONE
  title: Páginas de Exportações e Configurações
  description: >-
    Criar /exportacoes (formulário de nova exportação → POST /export; lista com
    status badges, ações e polling 10s) e /configuracoes (Perfil, Usuários admin
    com convite, Armazenamento somente leitura, Sistema com versões de
    XSD/serviços de /health e botão Verificar saúde).
  acceptance_criteria:
    - Formulário cria job via POST /export com formato, filtros e campos
    - Lista com status badges e polling 10s; download quando ready
    - Configurações com Perfil, Usuários, Armazenamento e Sistema
    - Seção Sistema lê versões de XSD e status de serviços de /health
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-6
  sprint_key: NOTA-SPRINT-6
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T11:46:54.373Z'
---
# Páginas de Exportações e Configurações
