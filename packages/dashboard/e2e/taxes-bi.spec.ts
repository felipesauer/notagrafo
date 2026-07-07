import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

/**
 * Tela de Impostos — KPIs por tributo com sparkline (NOTA-100). O seed tem
 * ICMS/IPI/PIS/COFINS + IBS/CBS/IS, então esperamos vários KPI cards de tributo.
 */
test.describe('Impostos (BI)', () => {
    test('mostra KPIs por tributo com sparkline', async ({ page }) => {
        await login(page);
        await page.goto('/explore?entity=impostos');

        // pelo menos um KPI card de tributo; o seed produz vários (incl. reforma)
        const kpis = page.getByTestId('kpi-tributo');
        await expect(kpis.first()).toBeVisible({ timeout: 10_000 });
        expect(await kpis.count()).toBeGreaterThan(1);

        // cada card tem um sparkline (svg do Recharts) — confere no primeiro
        await expect(kpis.first().locator('svg')).toBeVisible();
    });
});
