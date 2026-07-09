---
mnema:
  key: NOTA-203
  state: DRAFT
  title: 'Fix: destinatário só ON CREATE SET no mergeInvoice (reimport não atualiza)'
  description: >-
    nf.repository.ts:103 grava dados do destinatário apenas em ON CREATE SET,
    sem ON MATCH SET, enquanto emitente (:94-95) e NotaFiscal (:111-112) fazem
    os dois. Se uma empresa aparece primeiro como stub/destinatária incompleta e
    depois é reimportada com dados mais completos como destinatária, os dados
    NÃO são atualizados — divergência de comportamento entre emitente e
    destinatário. Alinhar o destinatário ao padrão do emitente (ON CREATE + ON
    MATCH SET). Também: remover o MATCH...RETURN emit sem uso em :98 (achado 5b,
    query extra por NF). Não corrompe dados hoje (base seed não tem stub sem
    razaoSocial), mas é inconsistência real de escrita.
  acceptance_criteria:
    - destinatário atualiza dados no reimport (ON MATCH SET como emitente)
    - MATCH...RETURN emit morto em :98 removido
    - >-
      teste de integração: importar NF com destinatário incompleto, reimportar
      completo, assere dados atualizados
  labels:
    - area:graph
    - dim:consistencia
    - tipo:bug
  estimate: 2
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:07.430Z'
---
# Fix: destinatário só ON CREATE SET no mergeInvoice (reimport não atualiza)
