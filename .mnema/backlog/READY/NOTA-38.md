---
mnema:
  key: NOTA-38
  state: READY
  title: 'Dashboard: UploadModal com drag-and-drop e polling do job'
  description: >-
    O UploadModal (.plan/03 seção 4) deve ter drag-and-drop de XML/ZIP e, após o
    202, fazer polling de GET /nf/jobs/:jobId (3s) exibindo o resultado
    (processadas/duplicatas/erros). Hoje só tem input file. Depende da NOTA-32
    (jobs/:jobId completo). Achado #7.
  acceptance_criteria:
    - Drag-and-drop de arquivo .xml/.zip (ondragover/ondrop) além do input
    - Após upload, polling de GET /nf/jobs/:jobId a cada 3s
    - Exibe resumo processadas/duplicatas/erros ao concluir
    - vite build/typecheck/lint verdes
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T22:56:02.290Z'
---
# Dashboard: UploadModal com drag-and-drop e polling do job
