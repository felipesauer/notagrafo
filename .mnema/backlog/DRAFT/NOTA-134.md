---
mnema:
  key: NOTA-134
  state: DRAFT
  title: 'UX: retirar timeline de Eventos da tela de detalhe da NF'
  description: >-
    Usuário: 'eventos da nota fiscal deveria sair da tela'. Em NFDetail.tsx a
    coluna lateral tem EventosTimeline (linhas 229, 255-283). Decisão a
    confirmar: remover a timeline do detalhe (a auditoria por-NF vai para a
    lente Eventos do Explorer) OU mover para uma aba/rota. Se removida, o hook
    useNFEvents fica órfão de novo (registrar). Confirmar destino antes de
    implementar (decision_record).
  acceptance_criteria: []
  labels:
    - area:dashboard
    - needs-decision
    - tipo:ux
  estimate: 1
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:47.007Z'
---
# UX: retirar timeline de Eventos da tela de detalhe da NF
