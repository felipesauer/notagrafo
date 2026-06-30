---
title: Mapa do planejamento do MVP NF Processor
topics: ["planning","mvp","nf-processor","roadmap"]
created_at: 2026-06-26T01:01:25.268Z
updated_at: 2026-06-29T23:31:03.599Z
---
O MVP do NF Processor foi planejado em 2026-06-25 a partir do levantamento em `.plan/` (5 arquivos: visão geral, schema de dados, contratos API, dashboard, infra/testes — definitivos: não inventar campos/endpoints/páginas fora do especificado).

Estrutura no mnema (tudo em READY, pronto para task_start):
- 7 epics NOTA-EPIC-1..7: 1=Fundação monorepo, 2=@nfp/core, 3=@nfp/graph, 4=@nfp/worker, 5=@nfp/api, 6=@nfp/dashboard, 7=infra/CI.
- 7 sprints NOTA-SPRINT-1..7: S1 Fundação, S2 Core, S3 Graph, S4 Worker, S5 API, S6 Dashboard, S7 Infra/release.
- 31 tasks NOTA-1..31. Mapeamento sprint→tasks: S1=1-4, S2=5-9, S3=10-12, S4=13-15, S5=16-21, S6=22-27, S7=28-31.

Caminho crítico sequencial S1→S7, com 43 dependências `blocks` encadeadas. Começar por NOTA-1 (setup do monorepo pnpm).

NOTA-9 é tarefa MANUAL do Felipe (baixar XSDs oficiais da SEFAZ) — bloqueia validador/parser de S2; não automatizável por agente.

Stack: monorepo pnpm; Node 20 + Fastify + TypeScript; BullMQ/Redis 7; Neo4j 5; React 18 + Vite. Pacotes @nfp/{core,graph,api,worker,dashboard} (renomeados p/ @notagrafo/* — ADR-2). Decisão de Auth divergente: ver memória auth-jwt-manual (ADR NOTA-ADR-1). Convenções de mutação no mnema: ver memória mnema-mutation-protocol.

--- ÉPICOS PÓS-MVP ---
- EPIC-8/9: hardening pós-auditoria (aderência a contrato, UI, cobertura 90/90/70).
- EPIC-10: i18n de código (identificadores PT→EN; domínio NF-e/contrato/Neo4j/UI ficam em PT).
- EPIC-11 (2026-06-29): "Enriquecimento das ligações do grafo (impostos, produtos, NCM/CFOP)". 11 tasks NOTA-55..65 em 6 fases bottom-up (core→graph→api→dashboard→seed→docs): 55 catálogo NCM/CFOP, 56 parser (NFref+tributos+totais), 57 graph (DEVOLVE+catálogo+total_*), 58 queries fiscais (taxSummary/taxByNcm/taxByCfop, productCompanies, getCompanyGraph.includeProdutos), 59 detalhe API (tributos/totais/cfop), 60 /stats/impostos + filtros fiscais + produto/empresas, 61 NFDetail UI, 62 página /impostos, 63 grafo enriquecido, 64 seed realista (impostos!=0+devolução), 65 docs. Modelo fiscal = ADR-6 (impostos na aresta CONTÉM + agregação por query, sem nós de CST). CANCELA segue não implementada (sem fonte de eventos). Convenção total_* e detalhes em mnema obs 019f151f / memória notagrafo-nfe-xsd-quirks (na memória de arquivos do agente).</content>

