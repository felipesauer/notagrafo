---
mnema:
  key: NOTA-19
  state: READY
  title: Rotas de NF e hook de auditoria
  description: >-
    Criar nf.routes.ts: POST /nf/upload (XML ou ZIP, valida XSD antes de
    enfileirar, 202/409/422), GET /nf/jobs/:jobId, GET /nf (filtros + paginação
    cursor-based), GET /nf/:chave (detalhe com itens), /nf/:chave/xml,
    /nf/:chave/eventos. Schemas em nf.schemas.ts. audit.hook.ts cria evento
    'consultada' assíncrono.
  acceptance_criteria:
    - Endpoints de NF implementados com status corretos (202/409/422/404)
    - Upload valida XSD antes de enfileirar e bloqueia duplicata
    - Paginação cursor-based opaca (base64url)
    - audit.hook cria evento 'consultada' assíncrono
    - Schemas Fastify com tags/summary/params/querystring/response
  estimate: 8
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:15.318Z'
---
# Rotas de NF e hook de auditoria
