# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: grafo.spec.ts >> grafo >> estado inicial pede uma busca; buscar uma empresa renderiza o grafo
- Location: e2e/grafo.spec.ts:5:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /cnpj=14200166000187/
Received string:  "http://localhost:8080/grafo?cnpj=%2214200166000187%22"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:8080/grafo?cnpj=%2214200166000187%22"

```

```yaml
- complementary:
  - text: notagrafo
  - navigation:
    - link "Overview":
      - /url: /
    - link "Invoices":
      - /url: /nf
    - link "Companies":
      - /url: /empresas
    - link "Products":
      - /url: /produtos
    - link "Graph":
      - /url: /grafo
    - link "Exports":
      - /url: /exportacoes
    - link "Settings":
      - /url: /configuracoes
  - text: Demo
  - button "Sign out"
- banner:
  - heading "Graph" [level=1]
  - button "Toggle theme": 🌙
  - button "Toggle language": PT
  - button "Notifications": 🔔
- textbox "Search company (Tax ID)": "14200166000187"
- button "Search"
- text: "Depth: 1"
- 'slider "Depth: 1"': "1"
- combobox:
  - option "Both" [selected]
  - option "Issuer"
  - option "Recipient"
- button "Reset"
- button "Export PNG"
- application:
  - img:
    - group "Edge from 14200166000187 to 60746948000112": "3"
  - img:
    - group "Edge from 14200166000187 to 47960950000121": "3"
  - img:
    - group "Edge from 14200166000187 to 11444777000161": "2"
  - img:
    - group "Edge from 11444777000161 to 14200166000187": "3"
  - img:
    - group "Edge from 47960950000121 to 14200166000187": "1"
  - img:
    - group "Edge from 33000167000101 to 14200166000187": "1"
  - img:
    - group "Edge from 14200166000187 to 33000167000101": "2"
  - img:
    - group "Edge from 14200166000187 to 99999999000191": "1"
  - group: "1420"
  - group: DB
  - group: AD
  - group: VE
  - group: CG
  - group: ED
  - img
  - button "Zoom In":
    - img
  - button "Zoom Out":
    - img
  - button "Fit View":
    - img
  - button "Toggle Interactivity":
    - img
  - link "React Flow attribution":
    - /url: https://reactflow.dev?utm_source=attribution
    - text: React Flow
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login } from './helpers.js';
  3  | 
  4  | test.describe('grafo', () => {
  5  |     test('estado inicial pede uma busca; buscar uma empresa renderiza o grafo', async ({ page }) => {
  6  |         await login(page);
  7  |         await page.getByRole('link', { name: /grafo|graph/i }).click();
  8  | 
  9  |         // sem ?cnpj → mensagem de estado vazio
  10 |         await expect(page.getByText(/busque uma empresa|search a company/i)).toBeVisible();
  11 | 
  12 |         // busca uma empresa (CNPJ do emitente das fixtures de demo)
  13 |         await page.getByPlaceholder(/buscar empresa|search company/i).fill('14200166000187');
  14 |         await page.getByRole('button', { name: /buscar|search/i }).click();
  15 | 
  16 |         // a URL passa a refletir o cnpj e o React Flow é renderizado
> 17 |         await expect(page).toHaveURL(/cnpj=14200166000187/);
     |                            ^ Error: expect(page).toHaveURL(expected) failed
  18 |         await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
  19 |     });
  20 | });
  21 | 
```