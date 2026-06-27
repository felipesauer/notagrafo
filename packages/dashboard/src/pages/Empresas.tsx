import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { useTopEmpresas, useEmpresa } from '../api/hooks.js';
import { CNPJText, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';

/** Card de detalhes inline de uma empresa (expandido na tabela). */
function EmpresaCard({ cnpj }: { cnpj: string }): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading } = useEmpresa(cnpj);
    if (isLoading) return <LoadingSkeleton linhas={2} />;
    const e = data as (Record<string, unknown> & { stats?: { totalNFsEmitidas?: number; totalNFsRecebidas?: number } }) | undefined;
    return (
        <div className="inline-card">
            <span>{t('empresas.nfsEmitidas')}: {e?.stats?.totalNFsEmitidas ?? 0}</span>
            <span>{t('empresas.nfsRecebidas')}: {e?.stats?.totalNFsRecebidas ?? 0}</span>
            <Link to={'/grafo' as string} search={{ cnpj } as never}>{t('empresas.verGrafo')}</Link>
        </div>
    );
}

export function EmpresasPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTopEmpresas();
    const [expandida, setExpandida] = useState<string | null>(null);

    if (isLoading) return <LoadingSkeleton linhas={6} />;
    if (isError || !data) return <InlineError onRetry={() => void refetch()} />;
    if (data.ranking.length === 0) return <EmptyState />;

    return (
        <div className="empresas">
            <h2>{t('empresas.titulo')}</h2>
            <table className="data-table">
                <thead>
                    <tr><th>{t('empresas.razaoSocial')}</th><th>{t('empresas.cnpj')}</th><th>{t('empresas.uf')}</th><th>{t('empresas.nfsEmitidas')}</th></tr>
                </thead>
                <tbody>
                    {data.ranking.map((e) => (
                        <>
                            <tr key={e.cnpj} onClick={() => setExpandida(expandida === e.cnpj ? null : e.cnpj)} className="data-table__row--clickable">
                                <td>{e.razaoSocial}</td>
                                <td><CNPJText cnpj={e.cnpj} /></td>
                                <td>{e.uf}</td>
                                <td>{e.totalNFs}</td>
                            </tr>
                            {expandida === e.cnpj && (
                                <tr key={`${e.cnpj}-card`}>
                                    <td colSpan={4}><EmpresaCard cnpj={e.cnpj} /></td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
