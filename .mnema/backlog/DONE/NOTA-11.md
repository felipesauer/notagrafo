---
mnema:
  key: NOTA-11
  state: DONE
  title: Repositório mergeNotaFiscal
  description: >-
    Criar nf.repository.ts com mergeNotaFiscal(nf, raw, itens) seguindo o padrão
    MERGE da seção 4 do 01 schema-dados.md: upsert emitente/destinatário, MERGE
    da NF, CREATE do RawData, arestas
    EMITIU/DESTINADA_A/USA_CFOP/CONTÉM/CLASSIFICADO_EM/TEM_RAW/TEM_EVENTO. MERGE
    (não CREATE) para nós com constraint. Spread condicional — sem
    null/undefined.
  acceptance_criteria:
    - >-
      Grava NF, empresas, produtos, NCM, CFOP, RawData e Evento conforme o
      padrão MERGE
    - Usa MERGE (não CREATE) para nós com constraint
    - Campos opcionais via spread condicional — sem null/undefined
    - Reprocessar a mesma chave não duplica nós
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-3
  sprint_key: NOTA-SPRINT-3
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T16:22:48.310Z'
---
# Repositório mergeNotaFiscal
