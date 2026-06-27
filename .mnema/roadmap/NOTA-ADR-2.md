---
mnema:
  key: NOTA-ADR-2
  kind: decision
  status: accepted
  title: 'Nomenclatura: projeto "notagrafo" e escopo de pacotes @notagrafo/*'
  context: >-
    O levantamento em .plan/ usa "NF Processor" como nome do produto e @nfp/*
    como escopo dos 5 pacotes (presente em scripts pnpm --filter, Dockerfiles
    multi-stage, CI e imports entre pacotes). O projeto real, porém, chama-se
    notagrafo (projeto mnema NOTA, repositório notagrafo). Manter @nfp/ criaria
    divergência permanente entre o nome do projeto e os identificadores de
    código.
  decision: >-
    O monorepo se chama "notagrafo" (name do package.json raiz) e os pacotes
    usam o escopo @notagrafo/{core,graph,api,worker,dashboard}. Toda referência
    a "nf-processor" / "NF Processor" como identificador e ao escopo @nfp/* é
    substituída por notagrafo / @notagrafo/*.
  rationale: >-
    Alinhar os identificadores de código ao nome real do projeto (notagrafo)
    evita confusão a longo prazo e mantém um único vocabulário. O custo é
    divergir do .plan, que é absorvido por este ADR — "NF Processor" segue
    válido apenas como nome de exibição/descrição do produto, não como
    identificador técnico.
  consequences: >-
    Todas as tasks seguintes (NOTA-2..31) devem usar @notagrafo/* nos imports,
    nos scripts pnpm --filter, nos COPY dos Dockerfiles
    (packages/*/package.json) e no name dos package.json. O name do
    docker-compose.yml (previsto como "nf-processor" no .plan, seção 1) deve ser
    "notagrafo". Onde o .plan escrever @nfp/ ou nf-processor como identificador,
    ler @notagrafo/ e notagrafo.
  superseded_by: null
  authored_by: 019f03ba-735c-725c-b52a-22a88c9abe61
  impacts:
    - package.json
    - packages/core/package.json
    - packages/graph/package.json
    - packages/api/package.json
    - packages/worker/package.json
    - packages/dashboard/package.json
    - docker-compose.yml
    - .plan/04 infra testes.md
    - NOTA-1
  metadata: {}
  at: '2026-06-26T11:50:54.457Z'
---
# Nomenclatura: projeto "notagrafo" e escopo de pacotes @notagrafo/*
