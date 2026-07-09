---
mnema:
  key: NOTA-198
  state: DONE
  title: 'Export: incluir XMLs originais das NF-e num ZIP'
  description: >-
    Nova opção no export para empacotar os XMLs originais (do storage) junto com
    os dados. ExportService aceita XmlStorage + flag incluirXml; gera .zip via
    adm-zip (dados.<formato> + xmls/<chave>.xml). Tolerante a XML ausente.
    Checkbox no dashboard.
  acceptance_criteria:
    - POST /export aceita opção de incluir XMLs
    - ZIP gerado com dados + XMLs originais
    - Checkbox no form do dashboard
    - Testes de rota/serviço + verificado E2E
  labels:
    - api
    - dashboard
    - export
    - storage
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T00:40:49.324Z'
---
# Export: incluir XMLs originais das NF-e num ZIP
