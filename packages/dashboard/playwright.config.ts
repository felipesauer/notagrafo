import { defineConfig } from '@playwright/test';

/**
 * Config Playwright (seção 3 do 04 infra-testes.md).
 * Os e2e rodam contra o stack completo subido via docker compose (profile app),
 * servido pelo nginx do dashboard em :8080 (NOTA-28/29 trazem o compose).
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'docker compose --profile app up --wait',
        url: 'http://localhost:8080',
        timeout: 120_000,
        // A stack (e o seed do usuário demo) é subida fora do Playwright — no CI
        // pelo job e2e, em dev pelo `pnpm dev`. Sempre reusa o que já está de pé;
        // só sobe a stack se a porta 8080 estiver livre.
        reuseExistingServer: true,
    },
});
