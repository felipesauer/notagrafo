---
title: "Suíte de integração precisa rodar serializada (Vitest 4: fileParallelism:false, não poolOptions.threads.singleThread)"
topics: ["testing","vitest","testcontainers","ci","integration"]
created_at: 2026-06-30T17:58:33.066Z
updated_at: 2026-06-30T17:58:33.066Z
---
A suíte `pnpm test:integration` (12 arquivos `*.integration.test.ts`) sobe containers próprios por arquivo via Testcontainers (Neo4j/Redis/MinIO). Se os arquivos rodam em paralelo, a máquina satura e o `beforeAll` estoura com `Hook timed out` / `Log message "Started." not received` — falha que PARECE bug de código mas é contenção de recursos.

A serialização tem que estar na config `vitest.integration.config.ts` como `fileParallelism: false` (top-level, Vitest 4). O formato antigo `poolOptions.threads.singleThread` (Vitest 3) foi REMOVIDO no Vitest 4 e é ignorado silenciosamente (emite warning DEPRECATED) — foi exatamente o bug A0 corrigido em 2026-06-30 (NOTA-66, PR #21). Confirmado: com fileParallelism:false a suíte passa 12/12 arquivos, 86/86 testes (~160s).

Para rodar UM arquivo de integração avulso na linha de comando, a flag é `--fileParallelism=false` (NÃO `--poolOptions...`, que o Vitest 4 rejeita como 'Unknown option').

Testes UNIT continuam não precisando de Docker — usam fake-driver/build-test-api/vi.hoisted (ver [[notagrafo-unit-test-strategy]]).
