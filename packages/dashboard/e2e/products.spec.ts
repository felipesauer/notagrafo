import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Produtos (explorador)', () => {
    test('troca para Produtos e lista com NCM linkável', async ({ page }) => {
        await login(page);
        // entidade via URL (as tabs só existem no mobile; no desktop navega-se pelo rail/URL)
        await page.goto('/explore?entity=produtos');
        await expect(page.getByTestId('data-table')).toBeVisible();
        await expect(page.getByTestId('data-table').locator('tbody tr').first()).toBeVisible();
        // o NCM é um deep-link para as NFs daquele NCM
        await expect(page.getByTestId('data-table').getByRole('link').first()).toBeVisible();
    });
});
