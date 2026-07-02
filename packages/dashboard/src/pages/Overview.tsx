import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Treemap,
} from 'recharts';
import { useOverview, useVolume, useTopCompanies, useByUf } from '../api/hooks.js';
import { CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';

function KpiCard({ label, valor }: { label: string; valor: string | number }): JSX.Element {
    return (
        <div className="kpi-card" data-testid="kpi-card">
            <span className="kpi-card__label">{label}</span>
            <strong className="kpi-card__valor">{valor}</strong>
        </div>
    );
}

// Paleta estável para as células do Treemap por UF.
const UF_CORES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

interface TreemapCellProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    uf?: string;
    size?: number;
}

/** Célula do Treemap: cor por índice e rótulo da UF quando há espaço. */
function UfCell({ x = 0, y = 0, width = 0, height = 0, index = 0, uf }: TreemapCellProps): JSX.Element {
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={UF_CORES[index % UF_CORES.length]} stroke="#fff" />
            {width > 40 && height > 20 && uf ? (
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={12}>
                    {uf}
                </text>
            ) : null}
        </g>
    );
}

/** Página de visão geral: KPIs, gráficos Recharts e últimas NFs (seção 3). */
export function OverviewPage(): JSX.Element {
    const { t } = useTranslation();
    const overview = useOverview();
    const volume = useVolume('dia');
    const topCompanies = useTopCompanies();
    const byUf = useByUf('emitente');

    if (overview.isLoading) return <LoadingSkeleton linhas={4} />;
    if (overview.isError || !overview.data) return <InlineError onRetry={() => void overview.refetch()} />;

    const o = overview.data;
    const volumeSeries = volume.data?.serie ?? [];
    const ranking = topCompanies.data?.ranking ?? [];
    // Treemap espera { name, size, ... } — área proporcional ao nº de NFs por UF.
    const treemapUf = (byUf.data?.porUf ?? []).map((u) => ({ name: u.uf, uf: u.uf, size: u.totalNFs, valorTotal: u.valorTotal }));

    return (
        <div className="overview">
            <section className="kpis-grid">
                <KpiCard label={t('overview.totalNFs')} valor={o.totalNFs} />
                <KpiCard label={t('overview.totalEmpresas')} valor={o.totalEmpresas} />
                <KpiCard label={t('overview.totalProdutos')} valor={o.totalProdutos} />
                <KpiCard label={t('overview.valorTotal')} valor={o.valorTotalProcessado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </section>

            <section className="chart" data-testid="chart">
                <h3>{t('overview.volumeTitulo')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={volumeSeries}>
                        <XAxis dataKey="periodo" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="totalNFs" fill="#2563eb" name={t('overview.totalNFs')} />
                        <Line yAxisId="right" dataKey="valorTotal" stroke="#16a34a" name={t('overview.valorTotal')} />
                    </ComposedChart>
                </ResponsiveContainer>
            </section>

            <section className="chart" data-testid="chart">
                <h3>{t('overview.topFornecedores')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ranking} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="razaoSocial" width={160} />
                        <Tooltip />
                        <Bar dataKey="valorTotal" fill="#2563eb" />
                    </BarChart>
                </ResponsiveContainer>
            </section>

            <section className="chart" data-testid="chart">
                <h3>{t('overview.distribuicaoUf')}</h3>
                {byUf.isLoading ? (
                    <LoadingSkeleton linhas={3} />
                ) : byUf.isError ? (
                    <InlineError onRetry={() => void byUf.refetch()} />
                ) : treemapUf.length === 0 ? (
                    <p className="empty-hint">{t('overview.distribuicaoUfVazio')}</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <Treemap data={treemapUf} dataKey="size" nameKey="name" content={<UfCell />}>
                            <Tooltip
                                formatter={(value, _name, item) => {
                                    const p = item?.payload as { valorTotal?: number; uf?: string } | undefined;
                                    const valor = (p?.valorTotal ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    return [`${String(value)} NFs · ${valor}`, p?.uf ?? ''];
                                }}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                )}
            </section>

            <section className="table-section">
                <h3>{t('overview.ultimasNFs')}</h3>
                <table className="data-table" data-testid="data-table">
                    <thead>
                        <tr>
                            <th>{t('overview.numero')}</th>
                            <th>{t('overview.valor')}</th>
                            <th>{t('overview.processadaEm')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {o.ultimasProcessadas.map((nf) => (
                            <tr key={nf.chaveAcesso}>
                                <td>{nf.numero}</td>
                                <td><CurrencyValue value={nf.valorTotal} /></td>
                                <td><DateDisplay value={nf.processadaEm} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
