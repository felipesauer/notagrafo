---
mnema:
  key: NOTA-76
  state: DONE
  title: >-
    NFDetail: paridade com .plan/03 §5 (chave copiável, Baixar XML, timeline de
    eventos, mini-grafo React Flow)
  description: >-
    NFDetail.tsx não exibe chaveAcesso (copiável), não tem botão Baixar XML, não
    mostra timeline de eventos e o mini-grafo é um link de texto — o .plan/03 §5
    promete os quatro. Agravante: endpoints já existem e estão órfãos (GET
    /nf/:chave/xml em nf.routes.ts:190 e GET /nf/:chave/eventos).
  acceptance_criteria:
    - Cabeçalho exibe a chave de acesso completa com ação de copiar
    - Botão Baixar XML consumindo GET /nf/:chave/xml
    - Timeline de eventos consumindo GET /nf/:chave/eventos com ícones por tipo
    - >-
      Mini-grafo React Flow com 3 nós Emitente->NotaFiscal->Destinatário,
      empresas clicáveis
    - i18n pt-BR e en; typecheck/lint/build verdes; e2e não regride
  labels:
    - area:dashboard
    - origem:auditoria-3
    - tipo:gap
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T18:41:24.787Z'
---
# NFDetail: paridade com .plan/03 §5 (chave copiável, Baixar XML, timeline de eventos, mini-grafo React Flow)
