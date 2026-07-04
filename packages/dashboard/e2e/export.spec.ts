import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('exportações', () => {
    test('cria uma exportação e a vê na lista com badge de status', async ({ page }) => {
        await login(page);
        await page.goto('/exportacoes');

        await page.getByTestId('export-format').selectOption('json');
        await page.getByRole('button', { name: /gerar exportação|generate export/i }).click();

        // a exportação aparece na lista com um badge de status
        await expect(page.getByTestId('export-list').getByTestId('data-table').locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('export-list').getByTestId('status-badge').first()).toBeVisible();
    });
});
