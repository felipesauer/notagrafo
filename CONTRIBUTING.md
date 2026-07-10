# Contribuindo com o notagrafo

Obrigado pelo interesse em contribuir! Este guia cobre o setup local, como rodar os
testes, o padrão de commits e o fluxo de Pull Request.

## Pré-requisitos

- **Node.js 20+** e **pnpm** (`corepack enable`)
- **Docker** e **Docker Compose** (para testes de integração/e2e e o stack local)

## Setup local

```bash
git clone https://github.com/felipesauer/notagrafo.git
cd notagrafo
pnpm install
cp .env.example .env

# Sobe a infraestrutura (redis, neo4j, minio, mailpit)
docker compose up -d

# Desenvolvimento (API + worker + dashboard)
pnpm dev
```

O monorepo é organizado em pacotes `@notagrafo/{core,graph,api,worker,dashboard}`.
Imports **entre** pacotes usam o caminho do pacote (`@notagrafo/core`); **dentro** de um
pacote, caminhos relativos.

## Rodando os testes

```bash
pnpm lint               # ESLint (no-explicit-any é erro fora de testes)
pnpm typecheck          # tsc --noEmit
pnpm test:unit          # Vitest (unitários, sem dependências externas)
pnpm test:integration   # Testcontainers sobe Neo4j/Redis/MinIO reais
pnpm test:e2e           # Playwright contra o docker compose (profile app)
```

> Os testes de integração exigem Docker rodando. Em CI, use
> `TESTCONTAINERS_RYUK_DISABLED=true`.

**Antes de abrir um PR**, garanta que `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` e
`pnpm test:integration` estão verdes.

## Padrão de commits — Conventional Commits

As mensagens seguem [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

Tipos comuns: `feat`, `fix`, `docs`, `test`, `refactor`, `build`, `ci`, `chore`.

Exemplos:

```
feat(api): adiciona endpoint GET /nf/:chave/eventos
fix(graph): evita duplicar aresta CONTÉM no reprocessamento
test(worker): cobre o seed contra o XSD oficial
```

## Fluxo de Pull Request

1. Crie uma branch a partir da `main`: `feat/minha-funcionalidade`.
2. Faça commits pequenos e descritivos (Conventional Commits).
3. Garanta lint, typecheck e testes verdes localmente.
4. Abra o PR contra a `main` com uma descrição clara (o que muda e por quê).
5. O CI (GitHub Actions) roda lint, testes unit/integration/e2e e o build das imagens.
6. Após aprovação na revisão, o PR é mergeado.

## Releases e publicação

Os releases são automatizados com [release-please](https://github.com/googleapis/release-please),
em **versionamento independente por pacote**. Você não edita `version` nem
`CHANGELOG` manualmente — quem faz isso são os Conventional Commits:

- `fix(...)` → bump de **patch** no(s) pacote(s) afetado(s).
- `feat(...)` → bump de **minor**.
- `feat(...)!` ou rodapé `BREAKING CHANGE:` → bump de **major**.
- `docs`/`chore`/`test`/`refactor`/`ci` → não geram release.

O **escopo** do commit deve mapear para o pacote (`core`, `graph`, `worker`, `api`),
pois é ele que decide qual pacote versiona. Ao mudar uma lib que outras consomem
(ex.: `core`), o plugin `node-workspace` encadeia o bump das dependências internas.

Fluxo:

1. Commits em `main` alimentam um **Release PR** por pacote, que o release-please
   mantém atualizado (versão + `CHANGELOG.md`).
2. Ao **mergear** o Release PR, ele cria a tag/release (ex.: `core-v0.2.0`) e dispara:
   - **npm** — publica os pacotes públicos em [`@notagrafo`](https://www.npmjs.com/org/notagrafo) com provenance.
   - **GHCR** — builda e publica as imagens `notagrafo-{api,worker,dashboard}`.

> Requer o secret **`NPM_TOKEN`** (automation token com permissão de publish na org)
> configurado no repositório. O push para o GHCR usa o `GITHUB_TOKEN` padrão.

## Reportando bugs e sugerindo funcionalidades

Use os templates de issue (**bug report** / **feature request**) ao abrir uma issue.

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob a [MIT](LICENSE).
