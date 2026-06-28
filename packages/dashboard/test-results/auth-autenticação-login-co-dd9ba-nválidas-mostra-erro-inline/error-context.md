# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> autenticação >> login com credenciais inválidas mostra erro inline
- Location: e2e/auth.spec.ts:10:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('alert')

```

```yaml
- main:
  - heading "notagrafo" [level=1]
  - text: E-mail
  - textbox "E-mail"
  - text: Password
  - textbox "Password"
  - button "Sign in"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, DEMO_USER } from './helpers.js';
  3  | 
  4  | test.describe('autenticação', () => {
  5  |     test('rota protegida redireciona para /login sem token', async ({ page }) => {
  6  |         await page.goto('/');
  7  |         await expect(page).toHaveURL(/\/login/);
  8  |     });
  9  | 
  10 |     test('login com credenciais inválidas mostra erro inline', async ({ page }) => {
  11 |         await page.goto('/login');
  12 |         await page.getByLabel(/e-?mail/i).fill(DEMO_USER.email);
  13 |         await page.getByLabel(/senha|password/i).fill('senha-errada');
  14 |         await page.getByRole('button', { name: /entrar|sign in/i }).click();
> 15 |         await expect(page.getByRole('alert')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  16 |     });
  17 | 
  18 |     test('login bem-sucedido entra na área autenticada', async ({ page }) => {
  19 |         await login(page);
  20 |         await expect(page.locator('.sidebar')).toBeVisible();
  21 |     });
  22 | });
  23 | 
```