---
mnema:
  key: NOTA-183
  state: IN_PROGRESS
  title: Motor de regras de alerta (avalia condições sobre os dados)
  description: >-
    Backend (@notagrafo/graph + @notagrafo/api): definir regras de alerta (tipo,
    condição, limiar) e um avaliador sob demanda (ADR-19). Regras iniciais: NF
    acima de limiar de valor; concentração de fornecedor > X%; pico/queda de
    volume vs média; NF com imposto zerado onde esperado; anomalia (dup/gap) do
    EPIC-26. Cada disparo gera Alerta {tipo, severidade, mensagem, refs,
    criadoEm}. Nomes de código em inglês. Testes das regras.
  acceptance_criteria:
    - Avaliador roda as regras e gera alertas com refs
    - Regras iniciais implementadas (valor/concentração/volume/imposto/anomalia)
    - Limiares configuráveis (config global)
    - Testes unit das regras
  labels:
    - alertas
    - api
    - bi
    - graph
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-27
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T18:40:45.871Z'
---
# Motor de regras de alerta (avalia condições sobre os dados)
