import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('exportações', () => {
    test('cria uma exportação e a vê na lista com badge de status', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /exportações|exports/i }).click();

        await page.locator('.export-form select').selectOption('json');
        await page.getByRole('button', { name: /gerar exportação|generate export/i }).click();

        // a exportação aparece na lista com um badge de status
        await expect(page.locator('.export-list .data-table tbody tr').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('.export-list .badge').first()).toBeVisible();
    });
});
