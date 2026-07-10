# Changelog

## [0.2.0](https://github.com/felipesauer/notagrafo/compare/api-v0.1.0...api-v0.2.0) (2026-07-10)


### Features

* **api:** auth JWT manual e rotas /auth/* (NOTA-17) ([29c8b2f](https://github.com/felipesauer/notagrafo/commit/29c8b2f2620a2a26bb4a8d0576c83f7150849741))
* **api:** boot Fastify e plugins base (NOTA-16) ([01c098f](https://github.com/felipesauer/notagrafo/commit/01c098fafcfc32c2fa9b1d69e633e0547d9a749f))
* **api:** completar resposta de GET /nf/jobs/:jobId (NOTA-32) ([c72a34d](https://github.com/felipesauer/notagrafo/commit/c72a34de2662cb83fd6943a467fc2f09976fac99))
* **api:** GET /export/:id expõe progresso/total quando processing (NOTA-35) ([2cd1c6a](https://github.com/felipesauer/notagrafo/commit/2cd1c6a2f0cf3b421c4ec1f36da4c3d7b0cc1edb))
* **api:** GET /nf retorna meta{total,filtrosAtivos} (NOTA-33) ([edf894f](https://github.com/felipesauer/notagrafo/commit/edf894fa465dfa7192aa88988a100f670896371c))
* **api:** observabilidade — telemetry, logger e metrics (NOTA-18) ([510b608](https://github.com/felipesauer/notagrafo/commit/510b608744b16c9bc57e0479609446bcec044a82))
* **api:** persistir metadados de export no Redis (NOTA-47, ADR-5) ([01cebcc](https://github.com/felipesauer/notagrafo/commit/01cebcc7301cdcd2d5f1c110bb49c0110d09f34a))
* **api:** rotas de empresa, export, stats e health (NOTA-20) ([3d061e7](https://github.com/felipesauer/notagrafo/commit/3d061e7e6f36953301e3557ed504dbe0244b0c3c))
* **api:** rotas de NF e hook de auditoria (NOTA-19) ([e46bfe9](https://github.com/felipesauer/notagrafo/commit/e46bfe9ffea8fa5f44e0e3e5690cafa6afbfb3e7))
* **auth:** cadastro de conta + perfil editável (nome/email/senha) ([#60](https://github.com/felipesauer/notagrafo/issues/60)) ([deec17e](https://github.com/felipesauer/notagrafo/commit/deec17e2632986dbfeb12201762979087f633df7))
* **auth:** flags AUTH_ENABLED e DEMO_AUTH_ENABLED para alternar autenticação ([42087c1](https://github.com/felipesauer/notagrafo/commit/42087c159c4cb3b0abef7980f8798d248aa215b0))
* **auth:** flags AUTH_ENABLED e DEMO_AUTH_ENABLED para alternar auth ([b0d41f8](https://github.com/felipesauer/notagrafo/commit/b0d41f8c91d1d2fd32d2faceb314a99d9321f59f))
* **bi:** alertas e monitoramento proativo (EPIC-27) ([#67](https://github.com/felipesauer/notagrafo/issues/67)) ([7100dad](https://github.com/felipesauer/notagrafo/commit/7100dad4ceb0a3a23bc777a1b36904ef25678826))
* **bi:** análises comparativas e detecção de anomalias (EPIC-26) ([#66](https://github.com/felipesauer/notagrafo/issues/66)) ([35376d8](https://github.com/felipesauer/notagrafo/commit/35376d8bd4af6f24efc0e08c203c46e8aeff132c))
* **bi:** grafo rico — centralidade, comunidades e evolução temporal (EPIC-28) ([#68](https://github.com/felipesauer/notagrafo/issues/68)) ([75cac8f](https://github.com/felipesauer/notagrafo/commit/75cac8f52b2aed924c150d72878686b18be1512c))
* **core:** resolveIdUnico() e utils de produto (NOTA-6) ([754cb7a](https://github.com/felipesauer/notagrafo/commit/754cb7a10c34205d3155745d55b69cbd6d9db4bb))
* **dashboard,api,graph:** Fase 7B — grafo ego rico (NF-e + produtos como nós) ([35e2333](https://github.com/felipesauer/notagrafo/commit/35e23334ea08010594a76087fb21aab1ddc6d4dc))
* **dashboard:** Treemap por UF no Overview com dados reais (NOTA-36) ([c6ca43f](https://github.com/felipesauer/notagrafo/commit/c6ca43fd5e756dd0676603381c511de80b5fbf98))
* **docker:** imagens de runtime enxutas via pnpm deploy (NOTA-192) ([#71](https://github.com/felipesauer/notagrafo/issues/71)) ([2be2d43](https://github.com/felipesauer/notagrafo/commit/2be2d43d4a2c9564689d720232fa509a252eca99))
* enriquecimento das ligações fiscais do grafo (EPIC-11) ([e62cdf5](https://github.com/felipesauer/notagrafo/commit/e62cdf593856dde310572069e472b06828c24a18))
* expor historicoPrecoProduto (endpoint + gráfico) (NOTA-46, ADR-4) ([6d04362](https://github.com/felipesauer/notagrafo/commit/6d0436205fcda88a9dbe79db11686a459d551912))
* **export:** bundle the original invoice XML files as a .zip (NOTA-198) ([#77](https://github.com/felipesauer/notagrafo/issues/77)) ([0eca40f](https://github.com/felipesauer/notagrafo/commit/0eca40f1a882153541e0031a7c8548df6d440b4c))
* **fiscal:** melhorias do cenário da Reforma — export de tributos, filtros IBS/CBS, transição, CST no detalhe (EPIC-25) ([#65](https://github.com/felipesauer/notagrafo/issues/65)) ([05a0a02](https://github.com/felipesauer/notagrafo/commit/05a0a02b37f5601303ac11b2d8d07b8a952c936d))
* fluxo fiscal entre empresas com Sankey (Nivo) na página Rede (NOTA-107) ([b21aa47](https://github.com/felipesauer/notagrafo/commit/b21aa4738bd2deb634ac1669e4642750e7d5b028))
* **graph:** export the graph as JSON with relationships (NOTA-199) ([#78](https://github.com/felipesauer/notagrafo/issues/78)) ([70affdd](https://github.com/felipesauer/notagrafo/commit/70affddb2606fd0574b8525aacc1f4d986b71e22))
* **monorepo:** setup base do workspace pnpm (NOTA-1) ([1c46335](https://github.com/felipesauer/notagrafo/commit/1c46335de763f6624440a05e55a892640c0c4b2c))
* rede comercial completa em WebGL com Reagraph (NOTA-108) ([3bdfd76](https://github.com/felipesauer/notagrafo/commit/3bdfd7624a1db8f26fc9759923a0cf053d511ead))
* sprint-1-foundation ([5ea2fb8](https://github.com/felipesauer/notagrafo/commit/5ea2fb8127f2657453c648557b820f9472a0bc74))
* **ts:** configuração TypeScript base do monorepo (NOTA-2) ([d7ed432](https://github.com/felipesauer/notagrafo/commit/d7ed432ddf40df6f7ca55b8bae8ebe44284fc415))
* upload ZIP atômico + seed reporta erros + cobertura faltante (NOTA-39) ([a922ef2](https://github.com/felipesauer/notagrafo/commit/a922ef2b21c7ef741f575e67e92766d9000c9bd3))
* **worker:** reportar progresso do job nos marcos do pipeline (NOTA-42) ([06e80c8](https://github.com/felipesauer/notagrafo/commit/06e80c8cd4c5c75208430c23695610fb40e34866))


### Bug Fixes

* **api:** alinhar GET /nf/:chave/eventos ao contrato (NOTA-34) ([6c15167](https://github.com/felipesauer/notagrafo/commit/6c151678fdb1d2ece3d7d272459baa605774a985))
* **api:** GET /nf/:chave/eventos retorna 404 para NF inexistente (NOTA-43) ([b75da2f](https://github.com/felipesauer/notagrafo/commit/b75da2f6730a217cab7a9d1f00f24ba797a42459))
* **api:** mapear status do job BullMQ ao contrato §3 (NOTA-41) ([d0a2bab](https://github.com/felipesauer/notagrafo/commit/d0a2bab38769e4a7a3f9246bb8530c497715c28e))
* **api:** raise dedicated auth rate-limit so it no longer breaks the e2e suite (NOTA-211) ([#92](https://github.com/felipesauer/notagrafo/issues/92)) ([de0f98e](https://github.com/felipesauer/notagrafo/commit/de0f98ea6f007093c53879abf1a3c3ae03283570))
* auditoria UX/UI rodada 2 — 12 correções (bugs + navegação + fricção) ([ee7a9db](https://github.com/felipesauer/notagrafo/commit/ee7a9db67e1f487c77330f3e1014e19bfd32a69a))
* **auditoria-3:** corrige os 10 achados da auditoria de integridade ([#26](https://github.com/felipesauer/notagrafo/issues/26)) ([95cc5c5](https://github.com/felipesauer/notagrafo/commit/95cc5c56b56d4cf73fb5c9cb2a3d56c37793eda5))
* **ci:** builda graph/worker no test-unit e bump Node 20-&gt;22 ([3e513d3](https://github.com/felipesauer/notagrafo/commit/3e513d334b21ed924be19a4d95dc05aec1313461))
* **ci:** builda libs antes do typecheck e corrige erros de tipo em testes ([2cf313e](https://github.com/felipesauer/notagrafo/commit/2cf313e5579257634ef9a2233276d6aedcef2952))
* **compose:** sobrepoe hosts de neo4j/redis/minio nos services api/worker/seed ([b0d41f8](https://github.com/felipesauer/notagrafo/commit/b0d41f8c91d1d2fd32d2faceb314a99d9321f59f))
* **dashboard,api:** auditoria UX/UI rodada 2 — 12 correções (EPIC-19) ([897c08f](https://github.com/felipesauer/notagrafo/commit/897c08f969cf52ecd14c8282ed9c0c1119a35201))
* revisão dos grafos + tela de eventos unificada ([14fc28e](https://github.com/felipesauer/notagrafo/commit/14fc28ea9ab36cbdcb9142e8e2e396f18809562a))


### Performance Improvements

* **docker:** rebuild incremental 3x mais rápido (camadas + cache do store) (NOTA-193) ([#73](https://github.com/felipesauer/notagrafo/issues/73)) ([9ead978](https://github.com/felipesauer/notagrafo/commit/9ead9780aac8752835d4658a7d22b669bcbca40f))
