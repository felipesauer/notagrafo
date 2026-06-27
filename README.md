# notagrafo

Sistema open-source de processamento e análise de **Notas Fiscais Eletrônicas (NFe)**.
Recebe XMLs de NFe, valida contra os XSDs oficiais da SEFAZ, processa via filas,
persiste os dados como um **grafo de relacionamentos** no Neo4j e expõe tudo via API REST
e um dashboard interativo com visualização de grafo.

**Objetivo:** rastrear relações entre empresas, produtos, CFOPs e NCMs de forma visual e
consultável — padrões, ligações comuns e caminhos entre emitentes e destinatários.

> Documento suportado: **NFe v4.00** (ADR NOTA-ADR-3). Licença **MIT**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces (`@notagrafo/{core,graph,api,worker,dashboard}`) |
| Backend | Node.js 20 + Fastify + TypeScript |
| Fila | BullMQ + Redis 7 |
| Grafo | Neo4j 5 |
| Storage XML | Configurável: local / S3 / MinIO (padrão: MinIO) |
| Validação / parse | XSD oficial via `libxmljs2` / `fast-xml-parser` |
| Auth | JWT manual (`@fastify/jwt`) |
| Dashboard | React + Vite + TanStack Router/Query, Recharts, React Flow + dagre |
| Testes | Vitest + Testcontainers + Playwright |
| Infra | Docker Compose (profiles) + GitHub Actions |

---

## Quickstart (5 minutos)

Pré-requisitos: **Docker** e **Docker Compose**.

```bash
# 1. Clone
git clone https://github.com/felipesauer/notagrafo.git
cd notagrafo

# 2. Configure o ambiente
cp .env.example .env
# (ajuste senhas em produção; os defaults servem para rodar localmente)

# 3. Suba tudo com dados de demonstração
docker compose --profile app --profile demo up --build
```

Depois que os serviços ficarem *healthy*:

- **Dashboard:** http://localhost:8080
- **API (Swagger):** http://localhost:3000/docs
- **Neo4j Browser:** http://localhost:7474
- **MinIO Console:** http://localhost:9001

O profile `demo` gera NFes fictícias e popula o grafo — abra o **dashboard → Grafo**,
busque uma empresa e navegue pelos relacionamentos.

> Se a porta `6379` (Redis) já estiver em uso no host, suba com
> `REDIS_PORT=16379 docker compose --profile app up`.

### Subir só a infraestrutura (para desenvolvimento)

```bash
docker compose up -d            # redis, neo4j, minio, mailpit
pnpm install
pnpm dev                        # API + worker + dashboard em modo dev
```

---

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). As principais:

| Variável | Padrão | Descrição |
|---|---|---|
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | `bolt://localhost:7687` / `neo4j` / `changeme` | Conexão Neo4j |
| `REDIS_URL` | `redis://localhost:6379` | Fila BullMQ |
| `XML_STORAGE_DRIVER` | `minio` | `local` \| `s3` \| `minio` |
| `AUTH_SECRET` / `AUTH_JWT_EXPIRES_IN` | — / `7d` | Assinatura e validade do JWT |
| `WORKER_CONCURRENCY` / `JOB_MAX_RETRIES` | `4` / `3` | Processamento do worker |
| `DEMO` / `DEMO_NF_COUNT` | `false` / `500` | Seed de demonstração |
| `OTEL_EXPORTER` | `none` | `console` \| `otlp` \| `none` |

---

## Comandos úteis

```bash
pnpm build              # builda todos os pacotes
pnpm test:unit          # testes unitários (Vitest)
pnpm test:integration   # testes de integração (Testcontainers: Neo4j/Redis/MinIO)
pnpm test:e2e           # testes e2e do dashboard (Playwright, contra docker compose)
pnpm lint               # ESLint
pnpm typecheck          # tsc --noEmit
```

---

## Arquitetura (visão rápida)

```
XML → [core: validate XSD + parse] → [worker: fila BullMQ] → [graph: merge no Neo4j]
                                                            → [storage: XML original]
                                  ↑                          ↓
                            [api: Fastify REST] ←──────── [dashboard: React]
```

- **`@notagrafo/core`** — tipos, validador XSD, parser, `resolveIdUnico`.
- **`@notagrafo/graph`** — driver Neo4j, migrations, `mergeNotaFiscal`, queries.
- **`@notagrafo/worker`** — storage de XML, filas BullMQ, seed de demo.
- **`@notagrafo/api`** — Fastify (auth, nf, empresa, export, stats, health).
- **`@notagrafo/dashboard`** — React + Vite (Overview, NFs, Empresas, Produtos, Grafo).

---

## Como contribuir

Contribuições são bem-vindas! Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para setup,
testes, padrão de commits (Conventional Commits) e fluxo de Pull Request.

## Licença

[MIT](LICENSE) © Felipe Sauer
