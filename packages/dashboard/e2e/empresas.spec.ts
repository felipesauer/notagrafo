import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Empresas', () => {
    test('lista empresas e expande os stats de uma linha', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /empresas|companies/i }).click();
        await expect(page.getByRole('heading', { name: /empresas|companies/i })).toBeVisible();
        await expect(page.locator('.data-table')).toBeVisible();

        const primeira = page.locator('.data-table tbody tr').first();
        await expect(primeira).toBeVisible();
        // clicar expande os stats (NFs emitidas/recebidas) num inline-card
        await primeira.click();
        await expect(page.locator('.inline-card').first()).toBeVisible();
        await expect(page.getByText(/nfs emitidas|issued invoices/i).first()).toBeVisible();
    });
});
