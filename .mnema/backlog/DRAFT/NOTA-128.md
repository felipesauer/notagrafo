---
mnema:
  key: NOTA-128
  state: DRAFT
  title: 'BUG: botão de grafo no peek da NF-e é morto (sem onClick/Link)'
  description: >-
    Usuário: 'botão do grafo para NF-e não funciona'. Causa raiz (subagente): em
    NFPeek.tsx:105 o botão com ícone <Waypoints/> é um <Button> SEM onClick, SEM
    asChild+Link, SEM to/search — botão morto desde o NOTA-109. A rota /grafo
    existe e aceita ?cnpj (router.tsx:106-113); o cnpj do emitente está
    disponível (o botão já é gated por nf.emitente?.cnpj). Correção mínima:
    transformar em asChild + <Link to='/grafo' search={{cnpj:
    nf.emitente.cnpj}}>, padrão idêntico ao de ExplorerNotas.tsx:39-40 (Link já
    importado). Nota: 'Ver no grafo' do NFDetail funciona (via GraphDrawer) —
    não mexer.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:bug
  estimate: 1
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:34.731Z'
---
# BUG: botão de grafo no peek da NF-e é morto (sem onClick/Link)
