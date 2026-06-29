---
mnema:
  key: NOTA-53
  state: DONE
  title: Renomear identificadores PT→EN no pacote @notagrafo/worker
  description: >-
    Padronizar para inglês os identificadores de LÓGICA DE CÓDIGO do pacote
    `packages/worker` (jobs, queue, seed), mantendo campos de domínio NF-e e
    labels/propriedades Neo4j.


    Renomear (exemplos da varredura):

    - seed/generator.ts: `gerarChave`→`generateAccessKey`,
    `gerarNFe`→`generateNFe` (EXPORTADA), tipo `NFeGerada`→`GeneratedNFe`.

    - seed/index.ts: `criarUsuarioDemo`→`createDemoUser`.

    - jobs/process-nfe.job.ts e queue/nf.queue.ts: variáveis/funções locais em
    PT (ex.: `mesclar`, `enfileirar`, `dados`) → inglês; manter `processNFe` se
    já em inglês.

    - Avaliar nomes de arquivo `process-nfe.job.ts` e `nf.queue.ts`: NFe/NF são
    siglas de domínio, podem permanecer; padronizar apenas se houver PT (não há
    nesses dois).


    NÃO MEXER: campos de domínio NF-e gerados (`chaveAcesso`, `valorTotal`,
    etc.), o `jobId=chaveAcesso` do BullMQ (chave de deduplicação — mudar quebra
    dedupe), labels/propriedades Neo4j no Cypher do seed (`:Usuario`, `email`,
    `senhaHash`...), credenciais do usuário demo (demo@notagrafo.local/demo1234,
    necessárias aos e2e).


    Depende de NOTA-50 (core) e NOTA-51 (graph): o worker importa
    `validarNFe`/`mergeNotaFiscal` etc.; aguardar renames upstream e ajustar
    imports. Atualizar testes unit do worker.
  acceptance_criteria:
    - >-
      Funções PT do worker renomeadas para inglês (gerarChave, gerarNFe,
      criarUsuarioDemo) e tipo NFeGerada→GeneratedNFe
    - Variáveis/parâmetros locais em PT nos jobs/queue renomeados para inglês
    - >-
      jobId=chaveAcesso (dedup BullMQ), campos de domínio gerados e Cypher do
      seed (label :Usuario, propriedades) permanecem inalterados
    - Credenciais do usuário demo preservadas (e2e continuam logando)
    - >-
      Imports de símbolos renomeados do core/graph atualizados; pnpm
      build/typecheck/lint passam; test:unit do worker verde
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-10
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T15:21:12.609Z'
---
# Renomear identificadores PT→EN no pacote @notagrafo/worker
