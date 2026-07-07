import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Empresas (explorador)', () => {
    test('troca para Empresas e abre o peek com stats', async ({ page }) => {
        await login(page);
        // entidade via URL (as tabs só existem no mobile; no desktop navega-se pelo rail/URL)
        await page.goto('/explore?entity=empresas');
        await expect(page.getByTestId('data-table')).toBeVisible();

        const primeira = page.getByTestId('data-table').locator('tbody tr').first();
        await expect(primeira).toBeVisible();
        // clicar abre o peek da empresa com os stats (NFs emitidas/recebidas)
        await primeira.click();
        await expect(page.getByTestId('empresa-peek')).toBeVisible();
        await expect(page.getByText(/nfs emitidas|issued invoices/i).first()).toBeVisible();
    });
});
