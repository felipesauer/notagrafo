---
mnema:
  key: NOTA-48
  state: DONE
  title: Corrigir search param do grafo (TanStack Router serializa cnpj com aspas)
  description: >-
    Bug e2e (auditoria 2): ao navegar de Empresas/NFDetail para /grafo via Link
    search={{cnpj}}, o TanStack Router serializa o search como JSON e a URL fica
    cnpj=%2214200166000187%22 (com aspas), então o grafo não encontra a empresa
    e o React Flow não renderiza. Definir um validateSearch/parse na rota /grafo
    para tratar cnpj como string crua, e ajustar os Links. Validar com o spec
    e2e grafo.spec.ts.
  acceptance_criteria:
    - Navegar para /grafo?cnpj=<cnpj> resulta na URL sem aspas e carrega o grafo
    - grafo.spec.ts passa contra o stack docker
    - Links de Empresas e NFDetail para o grafo continuam funcionando
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T02:35:53.651Z'
---
# Corrigir search param do grafo (TanStack Router serializa cnpj com aspas)
