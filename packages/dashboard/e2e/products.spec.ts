import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Produtos', () => {
    test('lista produtos e expande quantidade/preço médio', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /produtos|products/i }).click();
        await expect(page.getByRole('heading', { name: /produtos|products/i })).toBeVisible();
        await expect(page.locator('.data-table')).toBeVisible();

        const primeira = page.locator('.data-table tbody tr').first();
        await expect(primeira).toBeVisible();
        await primeira.click();
        await expect(page.getByText(/preço médio|average price/i).first()).toBeVisible();
    });
});
