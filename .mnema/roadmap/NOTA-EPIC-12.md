---
mnema:
  key: NOTA-EPIC-12
  kind: epic
  state: OPEN
  title: Auditoria 3 — correções dos achados confirmados (2026-07-02)
  description: >-
    Corrigir os 10 achados confirmados na auditoria de 2026-07-02 (5 scanners +
    verificação manual dupla): zip bomb no upload ZIP; LGPD_MASK_CPF documentado
    mas inexistente; NFDetail sem paridade com .plan/03 §5 (chave copiável,
    Baixar XML, timeline de eventos, mini-grafo React Flow); NFList sem colunas
    chave/destinatário/Ações (§4); sem GET /export de listagem (histórico da
    página some no reload, §9); export órfão em 'processing' após restart (ADR-5
    parcial); DLQ declarada (NF_DLQ) mas nunca usada; /auth/refresh sem a janela
    de 24h do contrato; worker sem graceful shutdown; mirror .mnema
    dessincronizado do banco. Baseline verde no início: typecheck/lint/build OK,
    unit 222/222, integração 86/86, pnpm audit limpo.
  metadata: {}
  created_at: '2026-07-02T16:29:38.268Z'
  closed_at: null
---
# Auditoria 3 — correções dos achados confirmados (2026-07-02)
