# Changelog

## [0.2.1](https://github.com/felipesauer/notagrafo/compare/worker-v0.2.0...worker-v0.2.1) (2026-07-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @notagrafo/graph bumped to 0.2.0

## [0.2.0](https://github.com/felipesauer/notagrafo/compare/worker-v0.1.0...worker-v0.2.0) (2026-07-10)


### Features

* **api:** rotas de NF e hook de auditoria (NOTA-19) ([e46bfe9](https://github.com/felipesauer/notagrafo/commit/e46bfe9ffea8fa5f44e0e3e5690cafa6afbfb3e7))
* **auth:** flags AUTH_ENABLED e DEMO_AUTH_ENABLED para alternar autenticação ([42087c1](https://github.com/felipesauer/notagrafo/commit/42087c159c4cb3b0abef7980f8798d248aa215b0))
* **core:** resolveIdUnico() e utils de produto (NOTA-6) ([754cb7a](https://github.com/felipesauer/notagrafo/commit/754cb7a10c34205d3155745d55b69cbd6d9db4bb))
* **docker:** imagens de runtime enxutas via pnpm deploy (NOTA-192) ([#71](https://github.com/felipesauer/notagrafo/issues/71)) ([2be2d43](https://github.com/felipesauer/notagrafo/commit/2be2d43d4a2c9564689d720232fa509a252eca99))
* enriquecimento das ligações fiscais do grafo (EPIC-11) ([e62cdf5](https://github.com/felipesauer/notagrafo/commit/e62cdf593856dde310572069e472b06828c24a18))
* **fiscal:** suporte à Reforma Tributária — leitura de IBS, CBS e IS (EPIC-24) ([#64](https://github.com/felipesauer/notagrafo/issues/64)) ([2ceff65](https://github.com/felipesauer/notagrafo/commit/2ceff65766cf21ed594a6dcd091f257f0b206011))
* **monorepo:** setup base do workspace pnpm (NOTA-1) ([1c46335](https://github.com/felipesauer/notagrafo/commit/1c46335de763f6624440a05e55a892640c0c4b2c))
* sprint-1-foundation ([5ea2fb8](https://github.com/felipesauer/notagrafo/commit/5ea2fb8127f2657453c648557b820f9472a0bc74))
* **ts:** configuração TypeScript base do monorepo (NOTA-2) ([d7ed432](https://github.com/felipesauer/notagrafo/commit/d7ed432ddf40df6f7ca55b8bae8ebe44284fc415))
* upload ZIP atômico + seed reporta erros + cobertura faltante (NOTA-39) ([a922ef2](https://github.com/felipesauer/notagrafo/commit/a922ef2b21c7ef741f575e67e92766d9000c9bd3))
* **worker:** filas BullMQ e job de processamento de NFe (NOTA-14) ([0ff7204](https://github.com/felipesauer/notagrafo/commit/0ff720440a5d6fd08be929f15b77b50bdba03b5f))
* **worker:** reportar progresso do job nos marcos do pipeline (NOTA-42) ([06e80c8](https://github.com/felipesauer/notagrafo/commit/06e80c8cd4c5c75208430c23695610fb40e34866))
* **worker:** seed de demo de NFes fictícias (NOTA-15) ([3c0c103](https://github.com/felipesauer/notagrafo/commit/3c0c103d8e75b7ebebc11a58103f8e240bdada93))
* **worker:** storage de XML configurável (NOTA-13) ([72354f5](https://github.com/felipesauer/notagrafo/commit/72354f5ef863241d17f5e68ab04589c074fc9746))


### Bug Fixes

* **auditoria-3:** corrige os 10 achados da auditoria de integridade ([#26](https://github.com/felipesauer/notagrafo/issues/26)) ([95cc5c5](https://github.com/felipesauer/notagrafo/commit/95cc5c56b56d4cf73fb5c9cb2a3d56c37793eda5))
* **ci:** builda graph/worker no test-unit e bump Node 20-&gt;22 ([3e513d3](https://github.com/felipesauer/notagrafo/commit/3e513d334b21ed924be19a4d95dc05aec1313461))
* **ci:** builda libs antes do typecheck e corrige erros de tipo em testes ([2cf313e](https://github.com/felipesauer/notagrafo/commit/2cf313e5579257634ef9a2233276d6aedcef2952))


### Performance Improvements

* **docker:** rebuild incremental 3x mais rápido (camadas + cache do store) (NOTA-193) ([#73](https://github.com/felipesauer/notagrafo/issues/73)) ([9ead978](https://github.com/felipesauer/notagrafo/commit/9ead9780aac8752835d4658a7d22b669bcbca40f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @notagrafo/core bumped to 0.2.0
    * @notagrafo/graph bumped to 0.2.0
