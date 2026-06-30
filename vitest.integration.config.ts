import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/*/src/**/*.integration.test.ts'],
        testTimeout: 60_000, // Testcontainers precisa de mais tempo
        hookTimeout: 60_000,
        // Serializa a suíte: cada arquivo sobe seus próprios containers (Neo4j/
        // Redis/MinIO via Testcontainers); rodá-los em paralelo satura a máquina
        // e estoura o hookTimeout no "Started." do Neo4j. No Vitest 4 isso é
        // `fileParallelism` top-level — o antigo poolOptions.threads.singleThread
        // foi removido e passou a ser ignorado silenciosamente.
        fileParallelism: false,
    },
});
