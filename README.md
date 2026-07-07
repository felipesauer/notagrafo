<p align="center">
  <img src="assets/notagrafo-logo.png" alt="notagrafo" width="360" />
</p>

Sistema open-source de processamento e análise de **Notas Fiscais Eletrônicas (NF-e)**.
Recebe XMLs de NF-e, valida contra os XSDs oficiais da SEFAZ, processa via filas,
persiste os dados como um **grafo de relacionamentos** no Neo4j e expõe tudo por uma
API REST e um dashboard interativo com visualização de grafo.

**Objetivo:** rastrear relações entre empresas, produtos, CFOPs e NCMs de forma
visual e consultável — padrões, ligações comuns e caminhos entre emitentes e
destinatários.

> Documento suportado: **NF-e v4.00**. Licença **MIT**.

---

## Sumário

- [Stack](#stack)
- [Quickstart (5 minutos)](#quickstart-5-minutos)
- [Portas e serviços](#portas-e-serviços)
- [Desenvolvimento](#desenvolvimento)
- [Autenticação](#autenticação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Arquitetura](#arquitetura)
- [Exportações](#exportações)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces (`@notagrafo/{core,graph,api,worker,dashboard}`) |
| Backend | Node.js 20 + Fastify + TypeScript |
| Fila | BullMQ + Redis 7 |
| Grafo | Neo4j 5 |
| Storage de XML | Configurável: `local` / `s3` / `minio` (padrão: MinIO) |
| Validação / parse | XSD oficial via `libxmljs2` / `fast-xml-parser` |
| Auth | JWT manual (`@fastify/jwt`) |
| Dashboard | React + Vite + TanStack Router/Query, Recharts, React Flow + dagre |
| Testes | Vitest + Testcontainers + Playwright |
| Infra | Docker Compose (profiles) + GitHub Actions |

---

## Quickstart (5 minutos)

A forma mais rápida de ver o sistema funcionando, com dados de demonstração.
Único pré-requisito: **Docker** e **Docker Compose**.

```bash
# 1. Clone
git clone https://github.com/felipesauer/notagrafo.git
cd notagrafo

# 2. Configure o ambiente (o Compose lê o .env)
cp .env.example .env
# os defaults já servem para rodar localmente; troque as senhas em produção

# 3. Suba tudo com dados de demonstração
docker compose --profile app --profile demo up --build
```

Quando os serviços ficarem *healthy*, acesse:

| Serviço | URL |
|---|---|
| **Dashboard** | http://localhost:8080 |
| **API (Swagger)** | http://localhost:3000/docs |
| **Neo4j Browser** | http://localhost:7474 |
| **MinIO Console** | http://localhost:9001 |

O profile `demo` gera NF-es fictícias, popula o grafo e cria um usuário de login
(ver [Autenticação](#autenticação)). Abra o **dashboard → Grafo**, busque uma
empresa e navegue pelos relacionamentos.

> **Porta do Redis em uso?** O host usa `6379` por padrão. Se já houver um Redis
> local nessa porta, suba com outra: `REDIS_PORT=16379 docker compose --profile app up`.

---

## Portas e serviços

Portas expostas no host com `docker compose --profile app --profile demo` (defaults
do [`.env.example`](.env.example); `REDIS_PORT` é configurável):

| Serviço | Host | Container | Observação |
|---|---|---|---|
| dashboard | `8080` | `80` | nginx servindo o build (apenas no modo Docker) |
| api | `3000` | `3000` | REST + Swagger em `/docs` |
| neo4j | `7474`, `7687` | `7474`, `7687` | HTTP (browser) e Bolt |
| redis | `6379` | `6379` | `REDIS_PORT` no host; `redis:6379` na rede interna |
| minio | `9000`, `9001` | `9000`, `9001` | API S3 e console |
| mailpit | `8035`, `1035` | `8025`, `1025` | captura de e-mail em dev (UI em `8035`) |

> No modo de **desenvolvimento** (`pnpm dev`) o dashboard **não** usa a `8080` —
> ele roda pelo Vite em **http://localhost:5173**. Veja abaixo.

---

## Desenvolvimento

Para iterar no código com hot-reload, sem buildar as imagens Docker da aplicação.
Pré-requisitos: **Node.js 20+**, **pnpm** e **Docker** (para a infra).

```bash
pnpm install
pnpm dev
```

O `pnpm dev`:

1. sobe a infraestrutura (Neo4j, Redis, MinIO, Mailpit) e **espera** ela ficar
   *healthy* — `docker compose up -d --wait`;
2. builda as libs internas (`core`, `graph`);
3. roda o seed de demonstração;
4. sobe **API**, **worker** e **dashboard** em modo watch, em paralelo.

URLs no modo dev:

| Serviço | URL |
|---|---|
| **Dashboard (Vite)** | **http://localhost:5173** |
| **API (Swagger)** | http://localhost:3000/docs |
| **Neo4j Browser** | http://localhost:7474 |

> A porta **`8080` só existe no modo Docker** (`--profile app`), onde o nginx serve
> o build estático. Em desenvolvimento, use sempre a **`5173`** (Vite).

Para subir **apenas a infraestrutura** e rodar os serviços manualmente:

```bash
pnpm docker:up                  # sobe redis, neo4j, minio, mailpit (e espera healthy)
pnpm dev:libs                   # builda core + graph
pnpm dev:seed                   # popula o grafo (opcional)
pnpm dev:packages               # api + worker + dashboard em watch
```

Como `Ctrl+C` encerra só os processos locais (a infra sobe *detached*), derrube
os containers e **libere as portas** quando terminar:

```bash
pnpm docker:down                # para e remove os containers (libera as portas)
```

> Os containers usam `restart: "no"` — não voltam sozinhos no boot da máquina.
> As portas do host são configuráveis via `.env` (veja `.env.example`), então
> o notagrafo não atropela outras aplicações locais.

---

## Autenticação

A API usa **JWT Bearer** emitido pelo `@fastify/jwt` (não Better Auth — ver
[ADR NOTA-ADR-1](.mnema/roadmap)). O login retorna um token; as rotas protegidas
exigem `Authorization: Bearer <token>`.

No profile **demo**, o seed cria um usuário para você entrar de imediato:

| Campo | Valor padrão | Variável |
|---|---|---|
| E-mail | `demo@notagrafo.local` | `DEMO_USER_EMAIL` |
| Senha | `demo1234` | `DEMO_USER_SENHA` |

A autenticação pode ser ligada/desligada por flags — útil para explorar a API sem
login em desenvolvimento:

- `AUTH_ENABLED` (padrão `true`): liga/desliga a auth na API e no dashboard.
- `DEMO_AUTH_ENABLED` (padrão `true`): **sobrepõe** `AUTH_ENABLED` quando `DEMO=true`.
- `VITE_AUTH_ENABLED` / `VITE_DEMO_AUTH_ENABLED`: espelham as flags acima no build do
  dashboard (SPA — as flags são resolvidas em *build-time*, então precisam estar
  presentes ao buildar).

---

## Variáveis de ambiente

A referência completa, comentada, está em [`.env.example`](.env.example) — copie
para `.env` e ajuste. As principais:

| Variável | Padrão | Descrição |
|---|---|---|
| `DEMO` / `DEMO_NF_COUNT` | `false` / `500` | Seed de NF-es fictícias no boot |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | `bolt://localhost:7687` / `neo4j` / `changeme` | Conexão Neo4j |
| `REDIS_URL` / `REDIS_PORT` | `redis://localhost:6379` / `6379` | Fila BullMQ; `REDIS_PORT` é a porta no host |
| `WORKER_CONCURRENCY` / `JOB_MAX_RETRIES` / `JOB_BACKOFF_DELAY` | `4` / `3` / `5000` | Processamento do worker |
| `XML_STORAGE_DRIVER` | `minio` | `local` \| `s3` \| `minio` |
| `PORT` / `NODE_ENV` | `3000` / `development` | API |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` | `100` / `60000` | Rate limit da API (req. por janela / janela em ms) |
| `AUTH_ENABLED` / `DEMO_AUTH_ENABLED` | `true` / `true` | Liga/desliga a auth (ver [Autenticação](#autenticação)) |
| `AUTH_SECRET` / `AUTH_JWT_EXPIRES_IN` | — / `7d` | Assinatura e validade do JWT |
| `EXPORT_TTL_HOURS` | `24` | Validade do arquivo de exportação |
| `LGPD_MASK_CPF` / `VITE_LGPD_MASK_CPF` | `false` / `false` | `true` → pseudonimiza CPFs de MEI (11 díg. no campo `cnpj`) nos logs da API (Pino) e, com a flag `VITE_`, na UI do dashboard. CNPJs passam intactos |
| `OTEL_EXPORTER` / `OTEL_ENDPOINT` | `none` / — | `console` \| `otlp` \| `none` |

> SMTP / magic-link estão **fora do MVP** (ver `.env.example`). Em dev, o Mailpit
> captura os e-mails.

---

## Scripts

```bash
pnpm dev                # infra (--wait) + libs + seed + api/worker/dashboard (watch)
pnpm demo               # stack completa em Docker, com dados de demo (--profile app --profile demo)
pnpm build              # builda todos os pacotes na ordem de dependência

pnpm test               # unit + integração
pnpm test:unit          # testes unitários (Vitest)
pnpm test:integration   # testes de integração (Testcontainers: Neo4j/Redis/MinIO)
pnpm test:e2e           # testes e2e do dashboard (Playwright, contra docker compose)
pnpm test:coverage      # cobertura dos testes unitários

pnpm lint               # ESLint
pnpm typecheck          # tsc --noEmit
pnpm format             # Prettier
```

> A suíte de **integração** roda serializada (sobe containers reais via
> Testcontainers). A suíte **e2e** exige a stack no ar — o jeito mais simples é
> `pnpm demo` em outro terminal.

---

## Arquitetura

```
XML → [core: valida XSD + parse] → [worker: fila BullMQ] → [graph: merge no Neo4j]
                                                          → [storage: XML original]
                                ↑                          ↓
                          [api: Fastify REST] ←────── [dashboard: React]
```

| Pacote | Responsabilidade |
|---|---|
| **`@notagrafo/core`** | tipos, validador XSD, parser, catálogo NCM/CFOP, `resolveUniqueId` |
| **`@notagrafo/graph`** | driver Neo4j, migrations, `mergeInvoice`, queries (empresa, NF, produto, fiscal) |
| **`@notagrafo/worker`** | storage de XML, filas BullMQ, jobs de processamento, seed de demo |
| **`@notagrafo/api`** | Fastify (auth, nf, empresa, export, stats, health), OpenAPI, observabilidade |
| **`@notagrafo/dashboard`** | React + Vite (Overview, NFs, Empresas, Produtos, Grafo, Impostos, Exportações) |

O grafo modela `Empresa`, `NotaFiscal`, `Produto`, `NCM`, `CFOP` como nós, ligados
por `EMITIU`, `DESTINADA_A`, `CONTÉM` (com os tributos por item), `CLASSIFICADO_EM`,
`USA_CFOP` e `DEVOLVE`.

---

## Exportações

A exportação de NF-es (`POST /api/v1/export`) é **assíncrona**: cria um job, gera o
arquivo (CSV / JSON / XLSX) em background e o disponibiliza via
`GET /api/v1/export/:id/download` até o TTL (`EXPORT_TTL_HOURS`, padrão 24h).

Os **metadados** do job são persistidos no Redis quando disponível, então
**sobrevivem a um restart da API**. O **arquivo** gerado fica em disco local do nó
(por instância) — adequado ao MVP single-node; multi-réplica exigiria um storage de
arquivos compartilhado.

---

## Como contribuir

Contribuições são bem-vindas! Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para setup,
testes, padrão de commits (Conventional Commits) e fluxo de Pull Request.

---

## Licença

[MIT](LICENSE) © Felipe Sauer
