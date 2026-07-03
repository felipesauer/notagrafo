import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Overview', () => {
    test('exibe KPIs, gráfico de volume e o Treemap por UF', async ({ page }) => {
        await login(page);
        // a Overview agora é uma tela secundária (/visao-geral); a home é o explorador
        await page.goto('/visao-geral');
        await expect(page.getByTestId('kpi-card').first()).toBeVisible();
        await expect(page.getByTestId('kpi-card')).toHaveCount(4);

        // seção de distribuição por UF (Treemap) com dados do seed
        await expect(page.getByRole('heading', { name: /distribuição por uf|distribution by state/i })).toBeVisible();
        // o gráfico recharts renderiza um svg dentro da seção
        await expect(page.getByTestId('chart').locator('svg').first()).toBeVisible();

        // tabela de últimas NFs processadas
        await expect(page.getByRole('heading', { name: /últimas nfs|latest processed/i })).toBeVisible();
    });
});
