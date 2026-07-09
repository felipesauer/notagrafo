---
mnema:
  key: NOTA-203
  state: IN_REVIEW
  title: 'Fix: destinatário só ON CREATE SET no mergeInvoice (reimport não atualiza)'
  description: >-
    nf.repository.ts destinatário só ON CREATE SET, sem ON MATCH SET, ao
    contrário de emitente/NF. Empresa que aparece antes como stub/incompleta e
    depois é reimportada como destinatária não tem dados atualizados. Alinhar ao
    padrão do emitente (ON CREATE + ON MATCH SET) e remover o MATCH...RETURN
    emit morto.
  acceptance_criteria:
    - destinatário atualiza dados no reimport (ON MATCH SET como emitente)
    - MATCH...RETURN emit morto removido
    - >-
      teste de integração: destinatário stub → reimport completo → dados
      atualizados
  labels:
    - area:graph
    - dim:consistencia
    - tipo:bug
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:55:00.628Z'
---
# Fix: destinatário só ON CREATE SET no mergeInvoice (reimport não atualiza)
