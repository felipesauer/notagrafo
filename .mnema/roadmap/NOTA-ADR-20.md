---
mnema:
  key: NOTA-ADR-20
  kind: decision
  status: accepted
  title: >-
    Métricas de grafo: Cypher puro (sem GDS), centralidade por grau +
    comunidades por componente conexo
  context: >-
    EPIC-28 (grafo rico) precisa de centralidade e detecção de comunidades. O
    compose usa neo4j:5-community com plugin apoc apenas. Spike confirmou: APOC
    5.26 disponível, GDS AUSENTE (gds.version() → Unknown function). GDS no
    Community é limitado e não está instalado. O usuário delegou a decisão.
  decision: >-
    Usar Cypher puro (sem GDS, sem novos plugins no compose). Centralidade =
    grau ponderado por parceiros distintos e volume, calculado sobre a rede
    derivada (a:Empresa)-[:EMITIU]->(nf)-[:DESTINADA_A]->(b:Empresa) — métrica
    interpretável no domínio ('empresa-hub' = transaciona com muitos).
    Comunidades = componentes conexos (WCC) via Cypher/APOC sobre a mesma rede,
    sem Louvain. PageRank/Louvain reais ficam como evolução futura caso se migre
    para GDS/Enterprise.
  rationale: null
  consequences: >-
    Prós: zero peso no compose (sem plugin/imagem enterprise), coerente com
    produto self-hosted e conta Pro; grau é a centralidade mais legível para o
    usuário fiscal; entrega já no MVP. Contras: sem PageRank (importância
    recursiva) nem Louvain (comunidades por modularidade) — grau e componente
    conexo são aproximações mais simples. Mitigável no futuro com GDS.
    Desbloqueia NOTA-188..191.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts: []
  metadata: {}
  at: '2026-07-07T19:43:24.859Z'
---
# Métricas de grafo: Cypher puro (sem GDS), centralidade por grau + comunidades por componente conexo
