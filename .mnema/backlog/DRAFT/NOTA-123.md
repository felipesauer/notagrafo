---
mnema:
  key: NOTA-123
  state: DRAFT
  title: 'Fase 5 — Telas secundárias: NFDetail, Exportações (wizard), Configurações'
  description: >-
    Redesenhar as telas secundárias com a nova linguagem. NFDetail
    (pages/NFDetail.tsx): cabeçalho com status vibrante (ícone+texto), cards
    emitente/destinatário, tabela de itens (NCM+tributos), totais, mini-grafo +
    drawer. Exportações (pages/Exports.tsx): layout LINEAR (wizard), não bento —
    preservar export-form/export-format/export-list. Configurações
    (pages/Settings.tsx): tema/idioma/perfil/health + toggle de densidade
    global. Manter os 3 estados (LoadingSkeleton/InlineError/EmptyState) em
    todas.
  acceptance_criteria:
    - >-
      NFDetail redesenhado com status ícone+texto, itens/tributos/totais e
      mini-grafo/drawer
    - >-
      Exportações em layout wizard linear; data-testid
      export-form/export-format/export-list preservados
    - Configurações com toggle de densidade global
    - specs nf-detail/export/upload verdes
    - typecheck/lint verdes
  labels:
    - dashboard
    - redesign
  estimate: 4
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:52.077Z'
---
# Fase 5 — Telas secundárias: NFDetail, Exportações (wizard), Configurações
