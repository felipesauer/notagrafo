import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/*/src/**/*.integration.test.ts'],
        testTimeout: 60_000, // Testcontainers precisa de mais tempo
        hookTimeout: 60_000,
        poolOptions: {
            threads: {
                singleThread: true, // Evita conflito de containers paralelos
            },
        },
    },
});
