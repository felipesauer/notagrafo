import { type JSX } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';
import { AppLayout } from './components/AppLayout.js';
import { LoginPage } from './pages/Login.js';
import { OverviewPage } from './pages/Overview.js';
import { Placeholder } from './pages/Placeholder.js';

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
const nfRoute = childRoute('/nf', () => <Placeholder titulo="Notas Fiscais" />);
const empresasRoute = childRoute('/empresas', () => <Placeholder titulo="Empresas" />);
const produtosRoute = childRoute('/produtos', () => <Placeholder titulo="Produtos" />);
const grafoRoute = childRoute('/grafo', () => <Placeholder titulo="Grafo" />);
const exportacoesRoute = childRoute('/exportacoes', () => <Placeholder titulo="Exportações" />);
const configuracoesRoute = childRoute('/configuracoes', () => <Placeholder titulo="Configurações" />);

const routeTree = rootRoute.addChildren([
    loginRoute,
    protectedLayout.addChildren([
        overviewRoute,
        nfRoute,
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
