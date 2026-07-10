# Changelog

## [0.2.0](https://github.com/felipesauer/notagrafo/compare/graph-v0.1.0...graph-v0.2.0) (2026-07-10)


### Features

* **api:** GET /nf retorna meta{total,filtrosAtivos} (NOTA-33) ([edf894f](https://github.com/felipesauer/notagrafo/commit/edf894fa465dfa7192aa88988a100f670896371c))
* **bi:** alertas e monitoramento proativo (EPIC-27) ([#67](https://github.com/felipesauer/notagrafo/issues/67)) ([7100dad](https://github.com/felipesauer/notagrafo/commit/7100dad4ceb0a3a23bc777a1b36904ef25678826))
* **bi:** análises comparativas e detecção de anomalias (EPIC-26) ([#66](https://github.com/felipesauer/notagrafo/issues/66)) ([35376d8](https://github.com/felipesauer/notagrafo/commit/35376d8bd4af6f24efc0e08c203c46e8aeff132c))
* **bi:** grafo rico — centralidade, comunidades e evolução temporal (EPIC-28) ([#68](https://github.com/felipesauer/notagrafo/issues/68)) ([75cac8f](https://github.com/felipesauer/notagrafo/commit/75cac8f52b2aed924c150d72878686b18be1512c))
* **core:** resolveIdUnico() e utils de produto (NOTA-6) ([754cb7a](https://github.com/felipesauer/notagrafo/commit/754cb7a10c34205d3155745d55b69cbd6d9db4bb))
* **dashboard,api,graph:** Fase 7B — grafo ego rico (NF-e + produtos como nós) ([35e2333](https://github.com/felipesauer/notagrafo/commit/35e23334ea08010594a76087fb21aab1ddc6d4dc))
* enriquecimento das ligações fiscais do grafo (EPIC-11) ([e62cdf5](https://github.com/felipesauer/notagrafo/commit/e62cdf593856dde310572069e472b06828c24a18))
* **fiscal:** melhorias do cenário da Reforma — export de tributos, filtros IBS/CBS, transição, CST no detalhe (EPIC-25) ([#65](https://github.com/felipesauer/notagrafo/issues/65)) ([05a0a02](https://github.com/felipesauer/notagrafo/commit/05a0a02b37f5601303ac11b2d8d07b8a952c936d))
* **fiscal:** suporte à Reforma Tributária — leitura de IBS, CBS e IS (EPIC-24) ([#64](https://github.com/felipesauer/notagrafo/issues/64)) ([2ceff65](https://github.com/felipesauer/notagrafo/commit/2ceff65766cf21ed594a6dcd091f257f0b206011))
* fluxo fiscal entre empresas com Sankey (Nivo) na página Rede (NOTA-107) ([b21aa47](https://github.com/felipesauer/notagrafo/commit/b21aa4738bd2deb634ac1669e4642750e7d5b028))
* **graph:** driver Neo4j e migrations idempotentes (NOTA-10) ([713cd73](https://github.com/felipesauer/notagrafo/commit/713cd7395b0bc5eee7446bc9d958c0cd8270230c))
* **graph:** queries de grafo empresa/nf/produto (NOTA-12) ([355884d](https://github.com/felipesauer/notagrafo/commit/355884d6896281593ec7f30efbb0eb202d365cc5))
* **graph:** repositório mergeNotaFiscal (NOTA-11) ([c790099](https://github.com/felipesauer/notagrafo/commit/c7900996ea6a05471082c20e8491cac370cd43ce))
* **monorepo:** setup base do workspace pnpm (NOTA-1) ([1c46335](https://github.com/felipesauer/notagrafo/commit/1c46335de763f6624440a05e55a892640c0c4b2c))
* rede comercial completa em WebGL com Reagraph (NOTA-108) ([3bdfd76](https://github.com/felipesauer/notagrafo/commit/3bdfd7624a1db8f26fc9759923a0cf053d511ead))
* sprint-1-foundation ([5ea2fb8](https://github.com/felipesauer/notagrafo/commit/5ea2fb8127f2657453c648557b820f9472a0bc74))
* **ts:** configuração TypeScript base do monorepo (NOTA-2) ([d7ed432](https://github.com/felipesauer/notagrafo/commit/d7ed432ddf40df6f7ca55b8bae8ebe44284fc415))
* upload ZIP atômico + seed reporta erros + cobertura faltante (NOTA-39) ([a922ef2](https://github.com/felipesauer/notagrafo/commit/a922ef2b21c7ef741f575e67e92766d9000c9bd3))


### Bug Fixes

* achados residuais A2/A3/A4 da auditoria (relacao do grafo, tipo DevolveEdge, teste NFref) ([#22](https://github.com/felipesauer/notagrafo/issues/22)) ([e2dc655](https://github.com/felipesauer/notagrafo/commit/e2dc65532878cca5b49981b7c2510fe8d360fe06))
* auditoria UX/UI rodada 2 — 12 correções (bugs + navegação + fricção) ([ee7a9db](https://github.com/felipesauer/notagrafo/commit/ee7a9db67e1f487c77330f3e1014e19bfd32a69a))
* correções A0/A1 da auditoria de integridade (config integração + filtros de produto) ([#21](https://github.com/felipesauer/notagrafo/issues/21)) ([ddc0e93](https://github.com/felipesauer/notagrafo/commit/ddc0e93e3abf024dc4723a8ad9cc3adbb7fafe48))
* **dashboard,graph:** correções da revisão da Fase 7 ([a0b1954](https://github.com/felipesauer/notagrafo/commit/a0b19541d6fdb536d06d27c79d38b7c5ac7e6dc0))
* **dev:** pnpm dev espera Neo4j healthy (--wait) + documenta porta 5173 ([#24](https://github.com/felipesauer/notagrafo/issues/24)) ([6e8f71a](https://github.com/felipesauer/notagrafo/commit/6e8f71a674e8d3d5620789214977000e447f9274))
* **graph:** dedup NF in listInvoices when NCM filter matches multiple items (NOTA-200) ([#80](https://github.com/felipesauer/notagrafo/issues/80)) ([61af0ae](https://github.com/felipesauer/notagrafo/commit/61af0ae6e5e2932150f9eea4c343f7406aca73f5))
* **graph:** exclude devoluções/stubs consistently across flow/alert/company/metrics (NOTA-201) ([#81](https://github.com/felipesauer/notagrafo/issues/81)) ([cb3e39f](https://github.com/felipesauer/notagrafo/commit/cb3e39f04265103b5d11c5e722d689fdda67409b))
* **graph:** update recipient data on reimport (ON MATCH SET) in mergeInvoice (NOTA-203) ([#83](https://github.com/felipesauer/notagrafo/issues/83)) ([4fc58d6](https://github.com/felipesauer/notagrafo/commit/4fc58d680384a4270b1e97c9c700c46727a272be))
* revisão dos grafos + tela de eventos unificada ([14fc28e](https://github.com/felipesauer/notagrafo/commit/14fc28ea9ab36cbdcb9142e8e2e396f18809562a))


### Performance Improvements

* **graph:** add Neo4j indexes for nf.valorTotal and nf.numero (NOTA-206) ([#84](https://github.com/felipesauer/notagrafo/issues/84)) ([2f36c18](https://github.com/felipesauer/notagrafo/commit/2f36c18150b48b068c243ab087cbea24b1242461))
