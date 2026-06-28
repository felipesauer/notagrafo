import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useTopProdutos, useHistoricoPreco } from '../api/hooks.js';
import { CurrencyValue, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';

/** Gráfico de evolução do preço médio de um produto por mês (NOTA-46). */
function HistoricoPrecoChart({ idUnico }: { idUnico: string }): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError } = useHistoricoPreco(idUnico);
    if (isLoading) return <LoadingSkeleton linhas={2} />;
    if (isError) return <p className="login__erro">{t('comum.erro')}</p>;
    const serie = data?.historico ?? [];
    if (serie.length === 0) return <p className="empty-hint">{t('produtos.semHistorico')}</p>;
    return (
        <div className="chart">
            <h4>{t('produtos.historicoPreco')}</h4>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={serie}>
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip formatter={(v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <Line dataKey="precoMedio" stroke="#2563eb" name={t('produtos.precoMedio')} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

interface Produto {
    idUnico: string;
    descricao?: string;
    ncm?: string;
    totalNFs?: number;
    quantidadeTotal?: number;
    valorTotal?: number;
    precoMedio?: number;
}

export function ProdutosPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTopProdutos();
    const [expandido, setExpandido] = useState<string | null>(null);

    if (isLoading) return <LoadingSkeleton linhas={6} />;
    if (isError || !data) return <InlineError onRetry={() => void refetch()} />;
    const ranking = (data.ranking as unknown as Produto[]) ?? [];
    if (ranking.length === 0) return <EmptyState />;

    return (
        <div className="produtos">
            <h2>{t('produtos.titulo')}</h2>
            <table className="data-table">
                <thead>
                    <tr><th>{t('produtos.descricao')}</th><th>{t('produtos.ncm')}</th><th>{t('produtos.totalNFs')}</th><th>{t('produtos.valorTotal')}</th></tr>
                </thead>
                <tbody>
                    {ranking.map((p) => (
                        <>
                            <tr key={p.idUnico} onClick={() => setExpandido(expandido === p.idUnico ? null : p.idUnico)} className="data-table__row--clickable">
                                <td>{p.descricao ?? '—'}</td>
                                <td>{p.ncm ?? '—'}</td>
                                <td>{p.totalNFs ?? 0}</td>
                                <td><CurrencyValue value={p.valorTotal ?? 0} /></td>
                            </tr>
                            {expandido === p.idUnico && (
                                <tr key={`${p.idUnico}-card`}>
                                    <td colSpan={4}>
                                        <div className="inline-card">
                                            <span>{t('produtos.quantidade')}: {p.quantidadeTotal ?? 0}</span>
                                            <span>{t('produtos.precoMedio')}: <CurrencyValue value={p.precoMedio ?? 0} /></span>
                                        </div>
                                        <HistoricoPrecoChart idUnico={p.idUnico} />
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
