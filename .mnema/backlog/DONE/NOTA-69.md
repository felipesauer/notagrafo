---
mnema:
  key: NOTA-69
  state: DONE
  title: Alinhar tipo DevolveEdge.dataEvento ao que o repositório grava (opcional)
  description: >-
    Achado A3 da auditoria. nf.types.ts: DevolveEdge declara dataEvento:Date
    como obrigatório, mas mergeInvoice (nf.repository.ts:188) grava só
    chaveRefNF — dataEvento nunca é preenchido. DevolveEdge não é usado na
    escrita (Cypher inline) nem lido por query; é inconsistência
    tipo↔implementação sem efeito runtime. Tornar dataEvento opcional
    (dataEvento?:Date). Documentar no comentário a situação de CancelaEdge
    (CANCELA fora por ADR-6), sem implementar CANCELA. Sem mudar gravação, só o
    tipo.
  acceptance_criteria:
    - 'DevolveEdge.dataEvento passa a ser opcional (dataEvento?: Date)'
    - 'Nenhuma regressão: código que usa DevolveEdge continua compilando'
    - typecheck e lint verdes
    - Decisão sobre CancelaEdge documentada no código (alinhado a ADR-6)
  estimate: 1
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:09:06.814Z'
---
# Alinhar tipo DevolveEdge.dataEvento ao que o repositório grava (opcional)
