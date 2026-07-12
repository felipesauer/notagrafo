---
mnema:
  key: NOTA-200
  state: IN_REVIEW
  title: 'Fix: listInvoices duplica NF na página com filtro NCM (falta DISTINCT)'
  description: >-
    GET /nf com filtro ncm retorna a mesma NF várias vezes quando a NF tem >1
    item de produtos distintos no mesmo NCM. listInvoices
    (nf.queries.ts:200-206) projeta RETURN nf sem DISTINCT após o MATCH
    (nf)-[:CONTÉM]->(:Produto)-[:CLASSIFICADO_EM]->(ncm), enquanto countInvoices
    (:163) usa count(DISTINCT nf). Consequência: página com duplicatas, slots do
    LIMIT desperdiçados, meta.total (12) diverge de data[] (14), e o nextCursor
    keyset pode pular/repetir NFs. CONFIRMADO em runtime (Neo4j real, seed 60
    NFs, ncm STARTS WITH '4011': 14 linhas / 12 chaves únicas).
  acceptance_criteria:
    - >-
      listInvoices retorna no máximo 1 linha por chaveAcesso independente de
      filtro ncm/cfop
    - meta.total (countInvoices) igual ao nº de chaves únicas retornáveis
    - >-
      teste unit (fake-driver) que verifica DISTINCT/dedup no Cypher e falharia
      sem o fix
    - >-
      teste de integração (Testcontainers) que reproduz NF multi-item mesmo NCM
      e assere 1 linha por NF
    - >-
      paginação por cursor permanece estável (sem pular/repetir NF entre
      páginas)
  labels:
    - area:graph
    - dim:correcao
    - tipo:bug
  depends_on: []
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-12T20:46:15.150Z'
---
# Fix: listInvoices duplica NF na página com filtro NCM (falta DISTINCT)
