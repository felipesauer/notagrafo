import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { login } from './helpers.js';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core', 'src', '__fixtures__', 'nfe-valida-v4.00.xml');

test.describe('upload de NFe', () => {
    test('envia um XML pelo modal e acompanha o status até o resumo', async ({ page }) => {
        // O processamento é assíncrono (worker via fila). No CI, o worker recém-subido
        // (boot frio + Redis/Neo4j frios) pode levar mais que o timeout padrão de 30s
        // para concluir o PRIMEIRO job — dá folga ao teste inteiro.
        test.setTimeout(75_000);
        await login(page);
        // o botão de envio está no header do explorador (Notas)
        await page.goto('/explore');
        await page.getByRole('button', { name: /enviar nfe|upload invoice/i }).click();

        await expect(page.getByRole('dialog')).toBeVisible();
        // a dropzone tem um input file (oculto) — setInputFiles funciona mesmo oculto
        await page.setInputFiles('input[type="file"]', FIXTURE);
        await page.getByRole('button', { name: /^enviar$|^upload$/i }).click();

        // Após o 202: ou processa e mostra o resumo (Processadas/Duplicatas/Erros) via polling,
        // ou a NF já existe (duplicata) — ambos confirmam o fluxo de feedback. Escopado ao
        // dialog para não colidir com o painel de Insights ("Last processed invoice").
        await expect(
            page.getByRole('dialog').getByText(/processadas|processed|duplicat|enfileirada|queued|já foi processada|already/i),
        ).toBeVisible({ timeout: 45_000 });
    });
});
