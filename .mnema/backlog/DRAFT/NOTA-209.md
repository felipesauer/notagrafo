---
mnema:
  key: NOTA-209
  state: DRAFT
  title: 'Robustez: teto de tamanho do XML no enqueue (evita payload gigante no Redis)'
  description: >-
    enqueueNFe grava o XML cru no payload do job (nf.queue.ts:50); com
    concorrência 4, XMLs grandes acumulam (xml+gzip+json+parsed) em memória por
    job. Não há teto de tamanho no enqueue (o limite anti-zip-bomb existe só no
    upload.utils da API, e cobre o total, não o XML individual). Adicionar um
    limite configurável (env, ex.: MAX_XML_BYTES, default generoso p/ NF-e real)
    verificado no enqueueNFe: XML acima do teto é rejeitado com erro claro ANTES
    de enfileirar. Streaming completo é fora de escopo (o pipeline é em memória
    por design); o teto é a mitigação proporcional.
  acceptance_criteria:
    - >-
      enqueueNFe rejeita XML acima de um teto configurável com erro claro
      (tipado)
    - teto configurável por env com default razoável para NF-e real
    - XML dentro do teto continua enfileirando normalmente
    - 'teste unit: XML acima e abaixo do teto (falharia sem o fix)'
    - documentar a env no .env.example/README
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
  updated_at: '2026-07-09T19:22:00.372Z'
---
# Robustez: teto de tamanho do XML no enqueue (evita payload gigante no Redis)
