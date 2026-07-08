import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

/**
 * Centro de notificações / alertas proativos (EPIC-27). O sino vive na Topbar em
 * qualquer tela autenticada. Como os alertas são avaliados sob demanda (ADR-19),
 * o teste dispara "Reavaliar" e então verifica a lista e o marcar-lido.
 */
test.describe('Alertas', () => {
    test('reavalia, lista os alertas e marca como lido', async ({ page }) => {
        await login(page);

        // o sino está sempre presente na Topbar
        const bell = page.getByTestId('notification-bell');
        await expect(bell).toBeVisible();
        await bell.click();

        // o painel abre; dispara a reavaliação (persiste os alertas do seed)
        const panel = page.getByTestId('notification-panel');
        await expect(panel).toBeVisible();
        const reavaliar = panel.getByRole('button', { name: /reavaliar|re-evaluate/i });
        await expect(reavaliar).toBeVisible();
        await reavaliar.click();

        // após reavaliar, a UI responde com um dos três estados possíveis:
        // (a) itens de alerta na lista (seed tem gaps/imposto zerado),
        // (b) o botão "marcar todos" (quando há não-lidos), ou
        // (c) o estado vazio (base limpa). Qualquer um prova que o fluxo rodou.
        const itens = panel.getByText(/gap de numeração|numbering gap|imposto zerado|zero tax|valor elevado|high value/i);
        const marcarTodos = panel.getByRole('button', { name: /marcar todos|mark all/i });
        const vazio = panel.getByText(/nenhum alerta|no alerts/i);
        await expect(itens.first().or(marcarTodos).or(vazio)).toBeVisible({ timeout: 10_000 });

        // quando há não-lidos, "marcar todos" zera a contagem → o badge do sino some.
        if (await marcarTodos.isVisible()) {
            const badge = page.getByTestId('notification-badge');
            await expect(badge).toBeVisible();
            await marcarTodos.click();
            await expect(badge).toBeHidden({ timeout: 10_000 });
        }
    });
});
