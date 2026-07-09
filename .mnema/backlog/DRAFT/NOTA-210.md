---
mnema:
  key: NOTA-210
  state: DRAFT
  title: 'Ops: healthcheck honesto do worker (heartbeat no Redis)'
  description: >-
    O worker não expõe healthcheck no compose — nada verifica que ele está vivo
    e consumindo a fila (só depends_on de redis/neo4j). O worker não tem porta
    HTTP. Probe honesto: o worker escreve um heartbeat (timestamp) numa chave
    Redis com TTL, atualizado periodicamente enquanto vivo e conectado ao Redis.
    Adicionar healthcheck no docker-compose que roda `node` (não há redis-cli na
    imagem alpine) checando a idade/existência da chave. Se o worker travar ou
    perder o Redis, o heartbeat expira → unhealthy. Honesto: valida processo
    vivo + conexão Redis (de onde a fila é consumida).
  acceptance_criteria:
    - worker escreve heartbeat periódico numa chave Redis com TTL
    - >-
      healthcheck no compose (via node) verifica o heartbeat e falha se
      ausente/velho
    - heartbeat para de ser escrito no shutdown gracioso
    - teste unit do heartbeat (escreve chave com TTL)
    - documentar no README/.env.example o intervalo/TTL se configurável
  labels:
    - area:worker
    - dim:robustez
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-32
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:22:02.950Z'
---
# Ops: healthcheck honesto do worker (heartbeat no Redis)
