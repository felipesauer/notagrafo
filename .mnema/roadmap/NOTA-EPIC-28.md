---
mnema:
  key: NOTA-EPIC-28
  kind: epic
  state: CLOSED
  title: 'Grafo de relações mais rico: centralidade, comunidades e evolução'
  description: >-
    Explora o diferencial do produto (o grafo NF-e→empresas→produtos). Direção:
    análise fiscal. ADR pendente na 1ª task: escolher GDS (plugin Neo4j Graph
    Data Science) vs Cypher puro/APOC vs cálculo no app — o Neo4j Community tem
    restrições ao GDS; decidir conforme o que o compose suporta sem peso
    excessivo. Escopo: (1) Centralidade — identificar empresas 'hub' da rede
    (grau/PageRank): ranking + destaque visual no grafo (tamanho/cor do nó). (2)
    Detecção de comunidades — clusters de empresas que transacionam entre si
    (Louvain se GDS, ou heurística por componente/vizinhança): colorir por
    comunidade no grafo + lista. (3) Evolução temporal — filtrar/animar a rede
    por período (como as relações cresceram). (4) Métricas no peek da empresa —
    grau, nº de parceiros, posição no ranking de centralidade. Reusa a RedeGraph
    (reagraph/WebGL) e as queries de grafo existentes.
  metadata: {}
  created_at: '2026-07-07T16:33:19.144Z'
  closed_at: '2026-07-07T20:21:36.055Z'
---
# Grafo de relações mais rico: centralidade, comunidades e evolução
