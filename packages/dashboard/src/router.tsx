import { type JSX } from 'react';
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';
import { isAuthRequired } from './lib/auth-config.js';
import { AppShell } from './components/layout/AppShell.js';
import { LoginPage } from './pages/Login.js';

// Páginas internas via lazy: cada uma vira um chunk próprio (route-based
// code-splitting), então libs pesadas — Recharts (Overview/Impostos/Produtos),
// @xyflow/react + dagre + html-to-image (Grafo/Detalhe) — saem do bundle
// inicial e só carregam ao navegar. Login e o shell ficam no chunk inicial.
const OverviewPage = lazyRouteComponent(() => import('./pages/Overview.js'), 'OverviewPage');
const NFListPage = lazyRouteComponent(() => import('./pages/NFList.js'), 'NFListPage');
const NFDetailPage = lazyRouteComponent(() => import('./pages/NFDetail.js'), 'NFDetailPage');
const CompaniesPage = lazyRouteComponent(() => import('./pages/Companies.js'), 'CompaniesPage');
const ProductsPage = lazyRouteComponent(() => import('./pages/Products.js'), 'ProductsPage');
const TaxesPage = lazyRouteComponent(() => import('./pages/Taxes.js'), 'TaxesPage');
const GraphPage = lazyRouteComponent(() => import('./pages/Graph.js'), 'GraphPage');
const ExportsPage = lazyRouteComponent(() => import('./pages/Exports.js'), 'ExportsPage');
const SettingsPage = lazyRouteComponent(() => import('./pages/Settings.js'), 'SettingsPage');

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
    component: AppShell,
});

// Aceita tanto componentes eager (() => JSX) quanto os lazy (AsyncRouteComponent).
type RouteComponent = ReturnType<typeof lazyRouteComponent> | (() => JSX.Element);
const childRoute = (path: string, component: RouteComponent) =>
    createRoute({ getParentRoute: () => protectedLayout, path, component });

const overviewRoute = childRoute('/', OverviewPage);
/** /nf aceita filtros via search (deep-link de Empresas/Grafo): cnpjEmitente, ncm, comImposto, status. */
const nfRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/nf',
    validateSearch: (search: Record<string, unknown>): { cnpjEmitente?: string; ncm?: string; comImposto?: boolean; status?: string } => ({
        cnpjEmitente: typeof search.cnpjEmitente === 'string' ? search.cnpjEmitente : undefined,
        ncm: typeof search.ncm === 'string' ? search.ncm : undefined,
        comImposto: search.comImposto === true || search.comImposto === 'true' ? true : undefined,
        status: typeof search.status === 'string' ? search.status : undefined,
    }),
    component: NFListPage,
});
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
