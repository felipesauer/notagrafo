---
mnema:
  key: NOTA-173
  state: DONE
  title: 'seed: NF-e de demo com o grupo da reforma'
  description: >-
    ~60% das vendas do seed saem com gIBSCBS + totais IBSCBSTot/ISTot, validando
    contra o XSD oficial (estrutura exata TCIBS/TIBSCBSMonoTot). Restante fica
    pré-reforma (transição). Teste no generator valida XSD + consistência
    IBS=UF+Mun.
  acceptance_criteria:
    - Seed gera NF-e com gIBSCBS válidas no XSD
    - Parte sem o grupo (transição)
    - Dashboard demo mostra IBS/CBS/IS
  labels:
    - reforma
    - seed
    - worker
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:37:44.260Z'
---
# seed: gerar NF-e de demo com o grupo da reforma (gIBSCBS)
