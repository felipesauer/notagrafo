import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('grafo', () => {
    test('estado inicial pede uma busca; buscar uma empresa renderiza o grafo', async ({ page }) => {
        await login(page);
        await page.goto('/graph');

        // sem ?cnpj → mensagem de estado vazio
        await expect(page.getByText(/busque uma empresa|search a company/i)).toBeVisible();

        // busca uma empresa (CNPJ do emitente das fixtures de demo)
        await page.getByPlaceholder(/buscar empresa|search company/i).fill('14200166000187');
        await page.getByRole('button', { name: /buscar|search/i }).click();

        // a URL passa a refletir o cnpj e o React Flow é renderizado
        await expect(page).toHaveURL(/cnpj=14200166000187/);
        await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
    });
});
