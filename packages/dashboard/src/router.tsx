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
const ExplorerPage = lazyRouteComponent(() => import('./pages/explorer/Explorer.js'), 'ExplorerPage');
const OverviewPage = lazyRouteComponent(() => import('./pages/Overview.js'), 'OverviewPage');
const NFDetailPage = lazyRouteComponent(() => import('./pages/NFDetail.js'), 'NFDetailPage');
const GraphPage = lazyRouteComponent(() => import('./pages/Graph.js'), 'GraphPage');
const ExportsPage = lazyRouteComponent(() => import('./pages/Exports.js'), 'ExportsPage');
const SettingsPage = lazyRouteComponent(() => import('./pages/Settings.js'), 'SettingsPage');
const RegisterPage = lazyRouteComponent(() => import('./pages/Register.js'), 'RegisterPage');

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
        redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }),
    component: LoginPage,
});

// Cadastro: rota PÚBLICA (irmã do login, fora do guard) — criar conta própria.
const cadastroRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterPage,
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

/**
 * Home (`/`): landing de BI do redesign (NOTA-EPIC-18) — reusa a OverviewPage
 * como painel-resumo. A navegação por entidade vive no Explorador (`/explorar`).
 */
const homeRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/',
    component: OverviewPage,
});

/**
 * Explorador (`/explorar`): a navegação por entidade. entity/peek/q/status + os
 * filtros de recorte (ufEmitente/cnpjEmitente/ncm/comImposto) vivem no search,
 * tornando o Explorer linkável e habilitando drill-through da Home e dos peeks
 * (empresa/grafo) para a lista de NF-e filtrada. Campos não listados aqui são
 * descartados pelo validateSearch — por isso os deep-links precisam deles.
 */
const explorarRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/explore',
    validateSearch: (search: Record<string, unknown>): {
        entity?: string; peek?: string; q?: string; status?: string;
        ufEmitente?: string; cnpjEmitente?: string; ncm?: string; comImposto?: boolean;
        dataEmissaoInicio?: string; dataEmissaoFim?: string;
        valorTotalMin?: string; valorTotalMax?: string; tipoNF?: string; finalidade?: string; cfop?: string;
    } => ({
        entity: typeof search.entity === 'string' ? search.entity : undefined,
        peek: typeof search.peek === 'string' ? search.peek : undefined,
        q: typeof search.q === 'string' ? search.q : undefined,
        status: typeof search.status === 'string' ? search.status : undefined,
        ufEmitente: typeof search.ufEmitente === 'string' ? search.ufEmitente : undefined,
        cnpjEmitente: typeof search.cnpjEmitente === 'string' ? search.cnpjEmitente : undefined,
        ncm: typeof search.ncm === 'string' ? search.ncm : undefined,
        comImposto: search.comImposto === true || search.comImposto === 'true' ? true : undefined,
        // Filtros avançados de NF (NOTA-125 D) — mantidos como string na URL.
        dataEmissaoInicio: typeof search.dataEmissaoInicio === 'string' ? search.dataEmissaoInicio : undefined,
        dataEmissaoFim: typeof search.dataEmissaoFim === 'string' ? search.dataEmissaoFim : undefined,
        valorTotalMin: typeof search.valorTotalMin === 'string' ? search.valorTotalMin : undefined,
        valorTotalMax: typeof search.valorTotalMax === 'string' ? search.valorTotalMax : undefined,
        tipoNF: typeof search.tipoNF === 'string' ? search.tipoNF : undefined,
        finalidade: typeof search.finalidade === 'string' ? search.finalidade : undefined,
        cfop: typeof search.cfop === 'string' ? search.cfop : undefined,
    }),
    component: ExplorerPage,
});
// /visao-geral: redireciona à Home (que agora é a própria Overview) — preserva
// bookmarks/deep-links antigos sem duplicar a página.
const visaoGeralRedirect = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/visao-geral',
    beforeLoad: () => {
        throw redirect({ to: '/' });
    },
});
const nfDetailRoute = childRoute('/invoice/$chave', NFDetailPage);
const grafoRoute = createRoute({
    getParentRoute: () => protectedLayout,
    path: '/graph',
    validateSearch: (search: Record<string, unknown>): { cnpj?: string } => ({
        cnpj: typeof search.cnpj === 'string' ? search.cnpj : undefined,
    }),
    component: GraphPage,
});
const exportacoesRoute = childRoute('/exports', ExportsPage);
const configuracoesRoute = childRoute('/settings', SettingsPage);

// Redirects de compatibilidade: os paths PT antigos (bookmarks/links externos)
// continuam funcionando, redirecionando para os novos em inglês. /nf/$chave e
// /explorar preservam os params/search na ida.
// `to`/`params` com cast: o `to` dentro de beforeLoad é tipado no momento da
// definição da rota, antes de o routeTree completo existir — o cast evita a
// dependência circular de tipos (mesmo padrão dos Link `as string` do código).
const legacyRedirects = [
    createRoute({ getParentRoute: () => protectedLayout, path: '/explorar', beforeLoad: ({ search }) => { throw redirect({ to: '/explore' as string, search } as never); } }),
    createRoute({ getParentRoute: () => protectedLayout, path: '/grafo', beforeLoad: ({ search }) => { throw redirect({ to: '/graph' as string, search } as never); } }),
    createRoute({ getParentRoute: () => protectedLayout, path: '/exportacoes', beforeLoad: () => { throw redirect({ to: '/exports' as string } as never); } }),
    createRoute({ getParentRoute: () => protectedLayout, path: '/configuracoes', beforeLoad: () => { throw redirect({ to: '/settings' as string } as never); } }),
    createRoute({ getParentRoute: () => protectedLayout, path: '/nf/$chave', beforeLoad: ({ params }) => { throw redirect({ to: '/invoice/$chave' as string, params } as never); } }),
];

const routeTree = rootRoute.addChildren([
    loginRoute,
    cadastroRoute,
    protectedLayout.addChildren([
        homeRoute,
        explorarRoute,
        visaoGeralRedirect,
        nfDetailRoute,
        grafoRoute,
        exportacoesRoute,
        configuracoesRoute,
        ...legacyRedirects,
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
