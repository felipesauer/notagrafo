import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/api.client.js';
import { useThemeStore } from '../stores/theme.store.js';

interface Overview {
    totalNFs: number;
    totalEmpresas: number;
    totalProdutos: number;
    valorTotalProcessado: number;
}

/** Página de visão geral (KPIs). Refinada na NOTA-24. */
export function OverviewPage(): JSX.Element {
    const { t } = useTranslation();
    const toggleTema = useThemeStore((s) => s.toggle);
    const tema = useThemeStore((s) => s.tema);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['stats', 'overview'],
        queryFn: () => apiFetch<Overview>('/stats/overview'),
    });

    return (
        <main className="overview">
            <header>
                <h1>{t('overview.titulo')}</h1>
                <button onClick={toggleTema}>{tema === 'claro' ? '🌙' : '☀️'}</button>
            </header>
            {isLoading && <p>{t('comum.carregando')}</p>}
            {isError && (
                <p role="alert">
                    {t('comum.erro')} <button onClick={() => void refetch()}>{t('comum.tentarNovamente')}</button>
                </p>
            )}
            {data && (
                <ul className="kpis">
                    <li>{t('overview.totalNFs')}: {data.totalNFs}</li>
                    <li>{t('overview.totalEmpresas')}: {data.totalEmpresas}</li>
                    <li>{t('overview.totalProdutos')}: {data.totalProdutos}</li>
                    <li>{t('overview.valorTotal')}: {data.valorTotalProcessado}</li>
                </ul>
            )}
        </main>
    );
}
