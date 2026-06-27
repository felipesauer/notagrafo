import { type JSX } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';
import { AppLayout } from './components/AppLayout.js';
import { LoginPage } from './pages/Login.js';
import { OverviewPage } from './pages/Overview.js';
import { NFListPage } from './pages/NFList.js';
import { NFDetailPage } from './pages/NFDetail.js';
import { EmpresasPage } from './pages/Empresas.js';
import { ProdutosPage } from './pages/Produtos.js';
import { GrafoPage } from './pages/Grafo.js';
import { ExportacoesPage } from './pages/Exportacoes.js';
import { ConfiguracoesPage } from './pages/Configuracoes.js';

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
        redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }),
    component: LoginPage,
});

/** Layout route protegido: exige token; senão redireciona a /login?redirect=origem. */
const protectedLayout = createRoute({
    getParentRoute: () => rootRoute,
    id: 'protected',
    beforeLoad: ({ location }) => {
        if (!useAuthStore.getState().isAuthenticated) {
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
const empresasRoute = childRoute('/empresas', EmpresasPage);
const produtosRoute = childRoute('/produtos', ProdutosPage);
const grafoRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/grafo',
    validateSearch: (search: Record<string, unknown>): { cnpj?: string } => ({
        cnpj: typeof search.cnpj === 'string' ? search.cnpj : undefined,
    }),
    component: GrafoPage,
});
const exportacoesRoute = childRoute('/exportacoes', ExportacoesPage);
const configuracoesRoute = childRoute('/configuracoes', ConfiguracoesPage);

const routeTree = rootRoute.addChildren([
    loginRoute,
    protectedLayout.addChildren([
        overviewRoute,
        nfRoute,
        nfDetailRoute,
        empresasRoute,
        produtosRoute,
        grafoRoute,
        exportacoesRoute,
        configuracoesRoute,
    ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
