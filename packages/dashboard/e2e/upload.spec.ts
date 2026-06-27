import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { login } from './helpers.js';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core', 'src', '__fixtures__', 'nfe-valida-v4.00.xml');

test.describe('upload de NFe', () => {
    test('abre o modal de upload, envia um XML e vê o feedback', async ({ page }) => {
        await login(page);
        await page.getByRole('link', { name: /notas fiscais|invoices/i }).click();
        await page.getByRole('button', { name: /enviar nfe|upload invoice/i }).click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await page.setInputFiles('input[type="file"]', FIXTURE);
        await page.getByRole('button', { name: /^enviar$|^upload$/i }).click();

        // mensagem de enfileirado ou duplicata (já processada por outro teste) — ambas confirmam o fluxo
        await expect(page.getByText(/enfileirada|queued|já foi processada|already/i)).toBeVisible({ timeout: 15_000 });
    });
});
