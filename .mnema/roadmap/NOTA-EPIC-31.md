---
mnema:
  key: NOTA-EPIC-31
  kind: epic
  state: CLOSED
  title: Auditoria abrangente + correções (2026-07-09)
  description: >-
    Auditoria de 7 dimensões (correção, segurança, cobertura, consistência
    API⇄dashboard⇄grafo, performance, DX, robustez operacional) do notagrafo,
    com correção dos achados de crítico a básico.


    Baseline verde na entrada: install ✓, build core/graph/worker ✓, typecheck
    ✓, lint ✓, unit 362/362 ✓ (47 arquivos), cobertura 94.14/72.9/95.54/95.78
    (atende 90/90/70).


    Achados priorizados (detalhe nas tasks):

    - P1 CORREÇÃO: listInvoices sem DISTINCT → duplica NF na página quando
    filtra por NCM (CONFIRMADO em runtime: 14 linhas / 12 únicas com ncm 4011;
    meta.total diverge de data[]). Padrão histórico "viés de MATCH".

    - P1 CORREÇÃO: inconsistência de filtro devolução/stub —
    flow/alert/company/graph.metrics NÃO excluem finalidade='devolucao',
    enquanto tax/product/duplicate excluem (CONFIRMADO: 7 devoluções ativas na
    base contam como transação nos alertas e no Sankey/rede).

    - P2 CORREÇÃO/ROBUSTEZ: parser aceita chaveAcesso malformada (@Id lixo →
    chave de 3 chars; DV mod-11 nunca conferido). CONFIRMADO em runtime. XSD
    barra na ingestão, mas parseNFe é API pública sem essa garantia.

    - P2 CONSISTÊNCIA: nf.repository destinatário só ON CREATE SET (sem ON MATCH
    SET) → reimport não atualiza dados do destinatário; diverge de emitente/NF.

    - P2 SEGURANÇA (defesa-em-profundidade): validateNFe usa libxmljs2 parseXml
    sem opções explícitas (nonet/dtdload:false). XXE/billion-laughs NÃO
    reprodutível na versão atual (lib já detecta loop e não busca externa —
    verificado), mas a segurança fica presa ao default da lib.

    - P3 SEGURANÇA: helmet ausente; rate-limit sem teto dedicado p/ /auth/login;
    validação fraca de senha/email no register; job.failedReason cru ao cliente.

    - P3 PERFORMANCE: índices ausentes p/ nf.valorTotal (filtro+order) e
    nf.numero.

    - P3 DX/DOC (agrupar): README porta Mailpit (8035/1035 → 8025/1025),
    .env.example sem DEMO_USER_EMAIL/SENHA e MINIO_ROOT_*, default OTEL_EXPORTER
    divergente, catch{} que mascara erro Neo4j, dev:seed || true.


    Não-achados (decisões conscientes, verificadas nas ADRs/observations):
    XLSX=CSV (intencional), impostos na aresta CONTÉM, sem GDS, NFe só v4.00,
    CANCELA fora de escopo. Cypher 100% parametrizado (sem injeção —
    confirmado). Zip-bomb tratado por metadados. JWT_SECRET/AUTH_SECRET aborta
    boot se ausente (sem default inseguro). /health honesto (checa
    Neo4j/Redis/storage → 503).
  metadata: {}
  created_at: '2026-07-09T18:22:41.410Z'
  closed_at: '2026-07-09T19:15:48.579Z'
---
# Auditoria abrangente + correções (2026-07-09)
