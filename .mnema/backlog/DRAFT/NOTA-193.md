---
mnema:
  key: NOTA-193
  state: DRAFT
  title: >-
    Build compartilhado: evitar recompilar core/graph em cada imagem (bake/base
    comum)
  description: >-
    Hoje api e worker recompilam core+graph+worker cada um. Introduzir um
    estágio base comum (ou docker-bake.hcl com cache compartilhado via buildx)
    para compilar as libs uma vez e reusar. Reduz o tempo total de build da
    stack. Medir antes/depois.
  acceptance_criteria: []
  labels:
    - docker
    - dx
    - infra
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T13:30:18.556Z'
---
# Build compartilhado: evitar recompilar core/graph em cada imagem (bake/base comum)
