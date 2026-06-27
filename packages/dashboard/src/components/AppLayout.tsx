import { type JSX } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { ExportBanner } from './ExportBanner.js';

/** Mapa rota → chave de título para o breadcrumb. */
const TITULOS: Record<string, string> = {
    '/': 'sidebar.overview',
    '/nf': 'sidebar.nfs',
    '/empresas': 'sidebar.empresas',
    '/produtos': 'sidebar.produtos',
    '/grafo': 'sidebar.grafo',
    '/exportacoes': 'sidebar.exportacoes',
    '/configuracoes': 'sidebar.configuracoes',
};

/** Layout das rotas autenticadas: Sidebar + Header + ExportBanner + conteúdo. */
export function AppLayout(): JSX.Element {
    const { t } = useTranslation();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const titulo = t(TITULOS[pathname] ?? 'sidebar.overview');

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-layout__main">
                <Header titulo={titulo} />
                <ExportBanner />
                <div className="app-layout__content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
