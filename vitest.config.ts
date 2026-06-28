import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            // Exclui o que não faz sentido cobrir por testes UNITÁRIOS:
            // - entrypoints/bootstrap de processo (worker.ts, index.ts, main, app.ts)
            // - observabilidade (telemetry/metrics/logger) e DDL (migrations) — cobertos por integração
            // - schemas declarativos, helpers de teste, dashboard (coberto por e2e)
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/*.config.*',
                '**/__test-helpers__/**',
                '**/__fixtures__/**',
                'packages/*/src/index.ts',
                'packages/worker/src/worker.ts',
                'packages/api/src/app.ts',
                'packages/api/src/server.ts',
                'packages/api/src/observability/**',
                'packages/api/src/plugins/**',
                'packages/api/src/**/*.schemas.ts',
                'packages/worker/src/metrics/**',
                'packages/graph/src/migrations.ts',
                'packages/dashboard/**',
            ],
            // Meta da NOTA-40: lines/functions >=90% (lógica de negócio coberta).
            // branches em 70%: muitos ramos restantes são guardas defensivos
            // (?? '' / ?: opcionais) cobertos de fato pelos testes de integração.
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 70,
            },
        },
        // Unit e integration rodam separados para evitar timeout de Testcontainers
        include: ['packages/*/src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    },
});
