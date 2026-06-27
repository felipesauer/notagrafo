import { type JSX } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store.js';

/** Os 7 itens de navegação (seção 2 do 03 dashboard.md). */
const ITENS = [
    { to: '/', icon: '🏠', key: 'sidebar.overview' },
    { to: '/nf', icon: '📄', key: 'sidebar.nfs' },
    { to: '/empresas', icon: '🏢', key: 'sidebar.empresas' },
    { to: '/produtos', icon: '📦', key: 'sidebar.produtos' },
    { to: '/grafo', icon: '🕸️', key: 'sidebar.grafo' },
    { to: '/exportacoes', icon: '⬇️', key: 'sidebar.exportacoes' },
    { to: '/configuracoes', icon: '⚙️', key: 'sidebar.configuracoes' },
] as const;

export function Sidebar(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const clear = useAuthStore((s) => s.clear);

    function logout(): void {
        clear();
        void navigate({ to: '/login' });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar__brand">notagrafo</div>
            <nav className="sidebar__nav">
                {ITENS.map((item) => (
                    <Link key={item.to} to={item.to as string} className="sidebar__item" activeProps={{ className: 'sidebar__item sidebar__item--active' }}>
                        <span aria-hidden>{item.icon}</span> {t(item.key)}
                    </Link>
                ))}
            </nav>
            <footer className="sidebar__footer">
                <span className="sidebar__user">{user?.nome ?? user?.email ?? '—'}</span>
                <button type="button" onClick={logout} className="sidebar__logout">
                    {t('sidebar.sair')}
                </button>
            </footer>
        </aside>
    );
}
