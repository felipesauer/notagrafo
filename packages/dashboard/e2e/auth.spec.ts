import { test, expect } from '@playwright/test';
import { login, DEMO_USER } from './helpers.js';

test.describe('autenticação', () => {
    test('rota protegida redireciona para /login sem token', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/login/);
    });

    test('login com credenciais inválidas mostra erro inline', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel(/e-?mail/i).fill(DEMO_USER.email);
        await page.getByLabel(/senha|password/i).fill('senha-errada');
        await page.getByRole('button', { name: /entrar|sign in/i }).click();
        await expect(page.getByRole('alert')).toBeVisible();
    });

    test('login bem-sucedido entra na área autenticada', async ({ page }) => {
        await login(page);
        await expect(page.locator('.sidebar')).toBeVisible();
    });
});
