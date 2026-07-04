---
mnema:
  key: NOTA-123
  state: READY
  title: 'Fase 5 — Telas secundárias: NFDetail, Exportações, Configurações'
  description: >-
    Refinar as telas secundárias com a linguagem BI. NFDetail: cabeçalho com
    status pill (ícone+texto), cards emitente/destinatário, itens
    (NCM+tributos), totais, mini-grafo/drawer. Exportações: layout linear
    (wizard), preservar export-form/export-format/export-list. Configurações:
    tema/idioma/perfil/health + toggle de densidade global (reusar
    DensityToggle). Manter os 3 estados
    (LoadingSkeleton/InlineError/EmptyState).
  acceptance_criteria:
    - >-
      NFDetail com status pill, itens/tributos/totais e mini-grafo/drawer
      coerentes
    - Configurações com seção de densidade (DensityToggle)
    - Exportações preserva export-form/export-format/export-list
    - specs nf-detail/export/upload verdes
    - typecheck/lint verdes
  labels:
    - dashboard
    - redesign
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T16:20:45.916Z'
---
# Fase 5 — Telas secundárias: NFDetail, Exportações (wizard), Configurações
