---
mnema:
  key: NOTA-13
  state: DONE
  title: Storage de XML configurável (@nfp/worker)
  description: >-
    Criar o módulo de storage de XML com driver configurável via
    XML_STORAGE_DRIVER (local | s3 | minio). Interface única para salvar e
    recuperar o XML original (usado pelo RawData e por GET /nf/:chave/xml).
    Padrão MinIO.
  acceptance_criteria:
    - Interface única com implementações local, s3 e minio
    - Driver selecionado por XML_STORAGE_DRIVER
    - Salvar e recuperar XML funciona (local e minio testados)
    - Variáveis conforme .env.example
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-4
  sprint_key: NOTA-SPRINT-4
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T17:52:55.906Z'
---
# Storage de XML configurável (@nfp/worker)
