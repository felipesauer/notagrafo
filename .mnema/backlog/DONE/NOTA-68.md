---
mnema:
  key: NOTA-68
  state: DONE
  title: >-
    Derivar relação emitente/destinatário no getCompanyGraph (corrigir rótulo
    hardcoded)
  description: >-
    Achado A2 da auditoria. company.queries.ts: a query de nós de
    getCompanyGraph (l.121-132) acha vizinhos por caminho bidirecional
    (EMITIU|DESTINADA_A) mas o map (l.138) crava relacao:'emitente' para TODO
    vizinho, ignorando a direção. NoVizinho.relacao é sempre 'emitente' mesmo
    para quem só recebe da raiz — rótulo impreciso no grafo visual. Derivar
    relacao da relação direta raiz↔vizinho: raiz EMITIU para vizinho →
    'destinatario'; vizinho EMITIU para raiz → 'emitente'. Computar na query e
    ler r.get('relacao') no map; atualizar teste para assertar os dois sentidos.
  acceptance_criteria:
    - >-
      getCompanyGraph deriva relacao da direção real entre raiz e vizinho (não
      hardcoded)
    - >-
      Vizinho que recebe da raiz → 'destinatario'; vizinho que emite para a raiz
      → 'emitente'
    - Teste unit asserta relacao nos dois sentidos (não só o Cypher)
    - typecheck, lint e test:unit verdes; contrato EmpresaGrafo preservado
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:09:02.401Z'
---
# Derivar relação emitente/destinatário no getCompanyGraph (corrigir rótulo hardcoded)
