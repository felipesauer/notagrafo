---
mnema:
  key: NOTA-136
  state: DRAFT
  title: 'UX: densidade das tabelas sem efeito percebido'
  description: >-
    Usuário: 'essa parte de densidade não funciona'. O DensityToggle (3 ícones)
    existe e está ligado (Explorer header) e as tabelas aplicam densityClass()
    no <table> (ExplorerNotas/Empresas/Produtos), com o padding via seletor
    descendente em globals.css. Investigar por que o usuário não percebe efeito:
    (a) as regras d-compact/d-relaxed em globals.css têm especificidade
    suficiente e cobrem as células (td/th) das tabelas shadcn? (b) o
    data-sticky/estrutura do <Table> anula o padding? (c) a diferença entre
    níveis é visível o bastante? Reproduzir alternando os 3 níveis e medir o
    padding real; corrigir os seletores/valores para diferença nítida. Também
    confirmar que só aparece onde faz sentido (tabelas), não em telas sem
    tabela.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 2
  priority: 4
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:52.623Z'
---
# UX: densidade das tabelas sem efeito percebido
