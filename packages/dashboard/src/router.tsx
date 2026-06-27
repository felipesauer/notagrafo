import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';
import { LoginPage } from './pages/Login.js';
import { OverviewPage } from './pages/Overview.js';

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
});

/** Guarda de rota: redireciona a /login quando não autenticado. */
function requireAuth(): void {
    if (!useAuthStore.getState().isAuthenticated) {
        throw redirect({ to: '/login' });
    }
}

const overviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: requireAuth,
    component: OverviewPage,
});

const routeTree = rootRoute.addChildren([loginRoute, overviewRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
