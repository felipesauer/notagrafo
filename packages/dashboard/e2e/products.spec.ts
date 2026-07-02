import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Produtos', () => {
    test('lista produtos e expande quantidade/preço médio', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /produtos|products/i }).click();
        // level:2 — o título da página é <h2>; sem isso o seletor também casaria
        // o <h1> de breadcrumb (mesmo texto da rota) → strict mode violation.
        await expect(page.getByRole('heading', { level: 2, name: /produtos|products/i })).toBeVisible();
        await expect(page.getByTestId('data-table')).toBeVisible();

        const primeira = page.getByTestId('data-table').locator('tbody tr').first();
        await expect(primeira).toBeVisible();
        await primeira.click();
        await expect(page.getByText(/preço médio|average price/i).first()).toBeVisible();
    });
});
