---
mnema:
  key: NOTA-113
  state: DRAFT
  title: Remover shell/páginas antigos + varredura final
  description: >-
    Encerramento: remover a AppShell/NavSidebar/SiteHeader antigos e as páginas
    de lista que foram absorvidas pelo Explorador
    (NFList/Companies/Products/Taxes como páginas isoladas), deixando só os
    componentes de conteúdo reaproveitados. Limpar rotas órfãs, i18n órfão,
    imports mortos. Varredura: zero rota morta, zero import órfão, bundle
    auditado vs baseline. Verificação visual final desktop+mobile nos 2 temas.
  acceptance_criteria:
    - shell e páginas antigas removidos; rotas/i18n/imports sem órfãos
    - bundle auditado; sem regressão de tamanho inicial
    - verificação visual final desktop+mobile claro+escuro
    - build/lint/test:unit/e2e verdes
  labels: []
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:56:10.491Z'
---
# Remover shell/páginas antigos + varredura final
