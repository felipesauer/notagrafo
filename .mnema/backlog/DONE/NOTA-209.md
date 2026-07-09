---
mnema:
  key: NOTA-209
  state: DONE
  title: 'Robustez: teto de tamanho do XML no enqueue'
  description: >-
    enqueueNFe grava o XML cru no payload do job; com concorrência 4, XMLs
    grandes acumulam em memória. Adicionar teto configurável (env MAX_XML_BYTES)
    verificado no enqueue: XML acima do teto é rejeitado com erro tipado ANTES
    de enfileirar. Streaming é fora de escopo (pipeline em memória por design).
  acceptance_criteria:
    - enqueueNFe rejeita XML acima do teto com erro tipado
    - teto configurável por env com default razoável
    - XML dentro do teto enfileira normalmente
    - teste unit acima/abaixo do teto (falharia sem o fix)
    - env documentada no .env.example/README
  labels:
    - area:worker
    - dim:robustez
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-32
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:32:03.745Z'
---
# Robustez: teto de tamanho do XML no enqueue
