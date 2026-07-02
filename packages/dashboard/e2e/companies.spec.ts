import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Empresas', () => {
    test('lista empresas e expande os stats de uma linha', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /empresas|companies/i }).click();
        // level:2 — o título da página é <h2>; sem isso o seletor também casaria
        // o <h1> de breadcrumb (mesmo texto da rota) → strict mode violation.
        await expect(page.getByRole('heading', { level: 2, name: /empresas|companies/i })).toBeVisible();
        await expect(page.getByTestId('data-table')).toBeVisible();

        const primeira = page.getByTestId('data-table').locator('tbody tr').first();
        await expect(primeira).toBeVisible();
        // clicar expande os stats (NFs emitidas/recebidas) num inline-card
        await primeira.click();
        await expect(page.getByTestId('inline-card').first()).toBeVisible();
        await expect(page.getByText(/nfs emitidas|issued invoices/i).first()).toBeVisible();
    });
});
