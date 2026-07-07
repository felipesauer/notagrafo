import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

/**
 * Tela de Anomalias (EPIC-26): entidade do Explorer que consolida duplicatas
 * prováveis e gaps de numeração. O seed tem gaps de numeração, então esperamos
 * conteúdo; o disclaimer de escopo de análise está sempre presente.
 */
test.describe('Anomalias', () => {
    test('abre a aba de anomalias e mostra os achados ou o estado limpo', async ({ page }) => {
        await login(page);
        await page.goto('/explore?entity=anomalias');

        // o card de gaps de numeração (o seed produz gaps) OU o empty state limpo
        const gaps = page.getByText(/gaps de numeração|numbering gaps/i);
        const limpo = page.getByText(/nenhuma anomalia|no anomalies/i);
        await expect(gaps.or(limpo)).toBeVisible({ timeout: 10_000 });

        // quando há achados, o aviso de escopo (sinaliza, não corrige) aparece
        if (await gaps.isVisible()) {
            await expect(page.getByText(/não as corrige|does not fix them/i)).toBeVisible();
        }
    });
});
