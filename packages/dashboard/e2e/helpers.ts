import type { Page } from '@playwright/test';

/** Credenciais do usuário de demo (criado pelo seed do profile demo). */
export const DEMO_USER = {
    email: process.env.E2E_EMAIL ?? 'demo@notagrafo.local',
    senha: process.env.E2E_SENHA ?? 'demo1234',
};

/** Faz login pela UI e aguarda a navegação para a área autenticada. */
export async function login(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel(/e-?mail/i).fill(DEMO_USER.email);
    await page.getByLabel(/senha|password/i).fill(DEMO_USER.senha);
    await page.getByRole('button', { name: /entrar|sign in/i }).click();
    await page.waitForURL('**/');
}
