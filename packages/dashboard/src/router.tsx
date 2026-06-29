import { type JSX } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';
import { isAuthRequired } from './lib/auth-config.js';
import { AppLayout } from './components/AppLayout.js';
import { LoginPage } from './pages/Login.js';
import { OverviewPage } from './pages/Overview.js';
import { NFListPage } from './pages/NFList.js';
import { NFDetailPage } from './pages/NFDetail.js';
import { CompaniesPage } from './pages/Companies.js';
import { ProductsPage } from './pages/Products.js';
import { TaxesPage } from './pages/Taxes.js';
import { GraphPage } from './pages/Graph.js';
import { ExportsPage } from './pages/Exports.js';
import { SettingsPage } from './pages/Settings.js';

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
        redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }),
    component: LoginPage,
});

/**
 * Layout route protegido: exige token; senão redireciona a /login?redirect=origem.
 * Quando a auth está desabilitada por env (ver lib/auth-config), o guard é
 * ignorado e as páginas ficam acessíveis sem login.
 */
const protectedLayout = createRoute({
    getParentRoute: () => rootRoute,
    id: 'protected',
    beforeLoad: ({ location }) => {
        if (isAuthRequired() && !useAuthStore.getState().isAuthenticated) {
            throw redirect({ to: '/login', search: { redirect: location.pathname } });
        }
    },
    component: AppLayout,
});

const childRoute = (path: string, component: () => JSX.Element) =>
    createRoute({ getParentRoute: () => protectedLayout, path, component });

const overviewRoute = childRoute('/', OverviewPage);
const nfRoute = childRoute('/nf', NFListPage);
const nfDetailRoute = childRoute('/nf/$chave', NFDetailPage);
const empresasRoute = childRoute('/empresas', CompaniesPage);
const produtosRoute = childRoute('/produtos', ProductsPage);
const impostosRoute = childRoute('/impostos', TaxesPage);
const grafoRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/grafo',
    validateSearch: (search: Record<string, unknown>): { cnpj?: string } => ({
        cnpj: typeof search.cnpj === 'string' ? search.cnpj : undefined,
    }),
    component: GraphPage,
});
const exportacoesRoute = childRoute('/exportacoes', ExportsPage);
const configuracoesRoute = childRoute('/configuracoes', SettingsPage);

const routeTree = rootRoute.addChildren([
    loginRoute,
    protectedLayout.addChildren([
        overviewRoute,
        nfRoute,
        nfDetailRoute,
        empresasRoute,
        produtosRoute,
        impostosRoute,
        grafoRoute,
        exportacoesRoute,
        configuracoesRoute,
    ]),
]);

/**
 * Serializadores de search baseados em URLSearchParams: todo valor escalar é
 * tratado como STRING (sem aspas na URL e sem coerção numérica). Objetos/arrays
 * usam JSON. Isso preserva identificadores como CNPJ (14200166000187) como
 * string — o default do TanStack Router faz JSON.stringify (gera aspas) e o
 * parseSearchWith coage números, descartando o cnpj no validateSearch (NOTA-48).
 */
export function stringifySearch(search: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(search)) {
        if (v === undefined || v === null) continue;
        sp.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : '';
}

export function parseSearch(searchStr: string): Record<string, unknown> {
    const sp = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
    const out: Record<string, unknown> = {};
    for (const [k, v] of sp.entries()) {
        // só objeto/array (começa com { ou [) volta via JSON; o resto fica string
        if (/^[{[]/.test(v)) {
            try {
                out[k] = JSON.parse(v);
                continue;
            } catch {
                /* mantém string */
            }
        }
        out[k] = v;
    }
    return out;
}

export const router = createRouter({ routeTree, stringifySearch, parseSearch });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
