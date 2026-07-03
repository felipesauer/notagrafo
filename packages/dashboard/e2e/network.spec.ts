import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Rede', () => {
    test('abre a página, mostra o Sankey de fluxo e alterna para a rede completa', async ({ page }) => {
        await login(page);
        await page.goto('/rede');

        // título da página e as duas abas de análise
        await expect(page.getByRole('heading', { name: /^rede$|^network$/i })).toBeVisible();
        const abaFluxo = page.getByRole('tab', { name: /fluxo de valor|value flow/i });
        const abaRede = page.getByRole('tab', { name: /rede completa|full network/i });
        await expect(abaFluxo).toBeVisible();
        await expect(abaRede).toBeVisible();

        // aba de fluxo (padrão): o Sankey do Nivo renderiza um svg com dados do seed
        await expect(page.locator('svg').first()).toBeVisible();

        // alterna para a rede completa: o canvas WebGL do Reagraph é montado
        await abaRede.click();
        await expect(page.getByRole('heading', { name: /rede comercial completa|full trade network/i })).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    });
});
