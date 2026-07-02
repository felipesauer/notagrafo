---
mnema:
  key: NOTA-95
  state: DRAFT
  title: Configurações, remoção do CSS legado e varredura final
  description: >-
    Settings real: card Aparência (tema via theme.store + idioma), card Health
    (badges por serviço), card Sobre. Deletar src/index.css inteiro (incl.
    compat block). Varredura final: zero classes BEM órfãs (grep className com
    __), zero emojis, zero hex hard-coded, i18n completo (ErrorBoundary, options
    de status na toolbar). Auditoria de bundle vs baseline da T2 (registrar
    comparação como observation).
  acceptance_criteria:
    - src/index.css deletado e app visualmente íntegra
    - Greps de classes BEM/emoji/hex sem ocorrências no TSX
    - Settings funcional com health check
    - Suíte e2e inteira verde
    - Comparação de bundle registrada
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T19:29:03.378Z'
---
# Configurações, remoção do CSS legado e varredura final
