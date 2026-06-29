---
mnema:
  key: NOTA-EPIC-11
  kind: epic
  state: OPEN
  title: >-
    Enriquecimento das ligações do grafo (impostos, produtos, NCM/CFOP) — API +
    dashboard
  description: >-
    Aprofundar as ligações de dados no grafo e expô-las na API e no dashboard,
    partindo do que o design em .plan/ previa mas o código não entregou.


    CONTEXTO / DIAGNÓSTICO (ver observação 019f14c3 e .plan/01,02,03):

    - Impostos por item (vICMS,vBCICMS,pICMS,vIPI,vPIS,vCOFINS,vII,vISSQN) JÁ
    são extraídos e gravados como propriedades da aresta CONTÉM, mas não são
    agregados, nem expostos estruturados, nem exibidos.

    - Arestas CANCELA e DEVOLVE têm tipos TS (CancelaEdge/DevolveEdge) mas
    mergeInvoice NUNCA as grava; o grupo ide/NFref/refNFe do XSD v4.00 (existe)
    é ignorado pelo parser.

    - Nós NCM/CFOP só guardam `codigo` — descricao/secao/tipo/natureza nunca
    populados (falta catálogo).

    - API: /nf/:chave não reformata `tributos`+`totais`+`cfop{descricao}` como o
    contrato .plan/02 l.351-370 manda; não há /stats/impostos nem filtros por
    imposto no GET /nf.

    - Dashboard: NFDetail não mostra impostos/NCM; Grafo só renderiza nós de
    Empresa (tipos notafiscal/produto existem em layout.ts, query nunca os
    retorna); arestas não exibem valor agregado; sem página de impostos.

    - BLOQUEADOR DE DEMO: seed gera 1 item ICMSSN102 com TODOS os impostos
    zerados — sem enriquecer o seed nada aparece.


    DECISÕES DESTE ÉPICO (com o Felipe em 2026-06-29):

    1. Modelo fiscal: MANTER impostos como propriedades da aresta CONTÉM (zero
    migração) + criar QUERIES de agregação por NCM/CFOP/UF/empresa/período. NÃO
    criar nós de CST/Imposto nesta rodada.

    2. Escopo: completo — core → graph → api → dashboard → seed.


    RESTRIÇÃO DE ESCOPO FISCAL (NOTA-ADR-3, .plan/01 l.43-50): suportar SOMENTE
    tributos com XSD vigente — ICMS, IPI, PIS, COFINS, II, ISSQN. CBS/IBS/IS
    (Reforma Tributária EC 132/2023) FORA — sem XSD oficial publicado.


    ENTREGA EM 6 FASES (bottom-up, PRs por pacote/fase): (0) catálogo NCM/CFOP;
    (1) parser fiscal mais rico + arestas CANCELA/DEVOLVE via NFref; (2) queries
    de agregação fiscal + cruzamento produto↔empresa; (3) API (tributos/totais
    no detalhe, /stats/impostos, filtros, OpenAPI); (4) dashboard (impostos no
    NFDetail, página de Impostos, grafo enriquecido); (5) seed realista. Manter
    build/typecheck/lint/testes verdes a cada task (estratégia de teste unit do
    projeto: fake-driver/build-test-api/vi.hoisted, cobertura 90/90/70).
  metadata: {}
  created_at: '2026-06-29T19:04:53.090Z'
  closed_at: null
---
# Enriquecimento das ligações do grafo (impostos, produtos, NCM/CFOP) — API + dashboard
