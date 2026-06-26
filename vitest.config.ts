import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 70,
            },
        },
        // Unit e integration rodam separados para evitar timeout de Testcontainers
        include: ['packages/*/src/**/*.test.ts'],
    },
});
