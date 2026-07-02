import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('listagem de NFs', () => {
    test('filtra por status e abre o detalhe de uma NF', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /notas fiscais|invoices/i }).click();
        await expect(page.getByTestId('data-table')).toBeVisible();

        // filtra por status ativa — o select de status da toolbar tem testid
        // próprio (o FilterSidebar tem outros selects)
        await page.getByTestId('nf-status-filter').selectOption('ativa');
        await expect(page.getByTestId('data-table').locator('tbody tr').first()).toBeVisible();

        // abre o detalhe pela primeira linha (link no número)
        await page.getByTestId('data-table').locator('tbody tr a').first().click();
        await expect(page).toHaveURL(/\/nf\//);
        await expect(page.getByText(/itens|items/i)).toBeVisible();
    });

    test('paginação avança e volta', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /notas fiscais|invoices/i }).click();
        const proxima = page.getByRole('button', { name: /próxima|next/i });
        if (await proxima.isEnabled()) {
            await proxima.click();
            await expect(page.getByRole('button', { name: /anterior|previous/i })).toBeEnabled();
        }
    });
});
