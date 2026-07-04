import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Produtos (explorador)', () => {
    test('troca para Produtos e lista com NCM linkável', async ({ page }) => {
        await login(page);
        await page.goto('/explorar');
        await page.getByRole('button', { name: /^produtos$|^products$/i }).first().click();
        await expect(page.getByTestId('data-table')).toBeVisible();
        await expect(page.getByTestId('data-table').locator('tbody tr').first()).toBeVisible();
        // o NCM é um deep-link para as NFs daquele NCM
        await expect(page.getByTestId('data-table').getByRole('link').first()).toBeVisible();
    });
});
