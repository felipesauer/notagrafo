---
mnema:
  key: NOTA-95
  state: IN_REVIEW
  title: Configurações, remoção do CSS legado e varredura final
  description: >-
    Settings real em Cards: Aparência (tema via Switch + idioma), Perfil,
    Usuários, Health (badges por serviço), Sobre/Armazenamento. Deletar
    src/index.css inteiro (incl. compat block) e remover o import de main.tsx.
    Varredura final: zero classes BEM órfãs (grep className com __), zero
    emojis, zero hex hard-coded no TSX, i18n completo. Auditoria de bundle vs
    baseline da T2.
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
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T01:10:34.044Z'
---
# Configurações, remoção do CSS legado e varredura final
