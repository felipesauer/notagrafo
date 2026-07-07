import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Detalhe da NF', () => {
    test('abre o detalhe, mostra itens e o link para o grafo', async ({ page }) => {
        await login(page);
        // abre o explorador (Notas), o peek e daí o detalhe completo
        await page.goto('/explore');
        await expect(page.getByTestId('data-table')).toBeVisible();
        await page.getByTestId('data-table').locator('tbody tr').first().click();
        await expect(page.getByTestId('nf-peek')).toBeVisible();
        await page.getByTestId('nf-peek').getByRole('link').last().click();
        await expect(page).toHaveURL(/\/nf\//);

        // seção de itens e o botão do grafo (abre o drawer, sem trocar de página)
        await expect(page.getByRole('heading', { name: /itens|items/i })).toBeVisible();
        const grafoBtn = page.getByRole('button', { name: /ver no grafo|view in graph/i });
        await expect(grafoBtn).toBeVisible();

        // o grafo abre como painel (dialog/sheet) mantendo a URL da NF
        await grafoBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page).toHaveURL(/\/nf\//);
    });
});
