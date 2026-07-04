import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('explorador de NFs', () => {
    test('filtra por status e abre o detalhe via peek', async ({ page }) => {
        await login(page);
        // a home é o explorador, entidade Notas por padrão
        await expect(page.getByTestId('data-table')).toBeVisible();

        // filtra por status ativa (select da toolbar do explorador)
        await page.getByTestId('nf-status-filter').selectOption('ativa');
        await expect(page.getByTestId('data-table').locator('tbody tr').first()).toBeVisible();

        // clicar numa linha abre o peek (drill-down in-place)
        await page.getByTestId('data-table').locator('tbody tr').first().click();
        await expect(page.getByTestId('nf-peek')).toBeVisible();

        // do peek, "abrir detalhe" leva à página completa da NF
        await page.getByTestId('nf-peek').getByRole('link').last().click();
        await expect(page).toHaveURL(/\/nf\//);
        await expect(page.getByText(/itens|items/i)).toBeVisible();
    });

    test('peek navega entre NFs (setas) sem sair da lista', async ({ page }) => {
        await login(page);
        await expect(page.getByTestId('data-table')).toBeVisible();
        await page.getByTestId('data-table').locator('tbody tr').first().click();
        await expect(page.getByTestId('nf-peek')).toBeVisible();
        // seta pra baixo troca a NF do peek, mantendo a lista
        await page.keyboard.press('ArrowDown');
        await expect(page.getByTestId('nf-peek')).toBeVisible();
        await expect(page).toHaveURL(/peek=/);
    });
});
