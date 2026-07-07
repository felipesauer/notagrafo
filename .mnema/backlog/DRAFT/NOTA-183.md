---
mnema:
  key: NOTA-183
  state: DRAFT
  title: Motor de regras de alerta (avalia condições sobre os dados)
  description: >-
    Backend: definir um conjunto de regras de alerta (tipo, condição, limiar) e
    um avaliador que roda sobre os dados (na ingestão de uma NF e/ou sob demanda
    por período). Regras iniciais: NF acima de limiar de valor; concentração de
    fornecedor > X%; pico/queda de volume vs média; NF com ICMS/IBS zerado onde
    esperado; anomalia (dup/gap) do EPIC-26. Cada disparo gera um Alerta {tipo,
    severidade, mensagem, refs (chaves/cnpj), criadoEm}. Testes das regras.
  acceptance_criteria:
    - Avaliador roda as regras e gera Alertas com refs
    - Regras iniciais implementadas (valor/concentração/volume/imposto/anomalia)
    - Limiares configuráveis
    - Testes unit das regras
  labels:
    - alertas
    - api
    - bi
    - graph
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:33:04.332Z'
---
# Motor de regras de alerta (avalia condições sobre os dados)
