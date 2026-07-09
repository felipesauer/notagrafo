---
mnema:
  key: NOTA-198
  state: DRAFT
  title: 'Export: incluir XMLs originais das NF-e num ZIP'
  description: >-
    Nova opção no export para empacotar os XMLs originais (do storage MinIO)
    junto com os dados. Backend: export.service busca os XMLs das NF-e do
    resultado e gera um .zip (dados + pasta de XMLs). API: aceitar a opção (ex.:
    incluirXml:true) no POST /export. Dashboard: checkbox 'incluir XMLs' no
    form. Considerar limite/tamanho. Testes.
  acceptance_criteria: []
  labels:
    - api
    - dashboard
    - export
    - storage
  estimate: 5
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T21:46:12.865Z'
---
# Export: incluir XMLs originais das NF-e num ZIP
