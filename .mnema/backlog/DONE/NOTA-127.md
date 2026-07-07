---
mnema:
  key: NOTA-127
  state: DONE
  title: >-
    BUG: export não preenche cnpjEmitente/cnpjDestinatario + XLSX é CSV
    disfarçado
  description: >-
    CNPJ aninhado saía vazio no export. Fix: flattenRow achata as linhas; XLSX
    abre em colunas (sep=+BOM); +3 testes.
  acceptance_criteria:
    - cnpjEmitente/cnpjDestinatario preenchidos em CSV/JSON
    - XLSX abre em colunas
    - testes de regressão verdes
  labels:
    - area:api
    - sev:alta
    - tipo:bug
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:57:12.954Z'
---
# BUG: export não preenche cnpjEmitente/cnpjDestinatario (colunas vazias) + XLSX é CSV disfarçado
