---
mnema:
  key: NOTA-210
  state: DONE
  title: 'Ops: healthcheck honesto do worker (heartbeat no Redis)'
  description: >-
    Worker sem healthcheck no compose. Sem porta HTTP. Probe honesto: worker
    escreve heartbeat (timestamp) numa chave Redis com TTL, atualizado
    periodicamente enquanto vivo/conectado. Healthcheck no compose roda node
    (sem redis-cli na alpine) checando a chave. Trava/perda de Redis → heartbeat
    expira → unhealthy.
  acceptance_criteria:
    - worker escreve heartbeat periódico numa chave Redis com TTL
    - >-
      healthcheck no compose (via node) verifica o heartbeat e falha se
      ausente/velho
    - heartbeat para no shutdown gracioso
    - teste unit do heartbeat
    - documentar no README/.env.example
  labels:
    - area:worker
    - dim:robustez
  depends_on: []
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-32
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:36:27.051Z'
---
# Ops: healthcheck honesto do worker (heartbeat no Redis)
