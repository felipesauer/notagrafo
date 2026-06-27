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
} from 'recharts';
import { useOverview, useVolume, useTopEmpresas } from '../api/hooks.js';
import { CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';

function KpiCard({ label, valor }: { label: string; valor: string | number }): JSX.Element {
    return (
        <div className="kpi-card">
            <span className="kpi-card__label">{label}</span>
            <strong className="kpi-card__valor">{valor}</strong>
        </div>
    );
}

/** Página de visão geral: KPIs, gráficos Recharts e últimas NFs (seção 3). */
export function OverviewPage(): JSX.Element {
    const { t } = useTranslation();
    const overview = useOverview();
    const volume = useVolume('dia');
    const topEmpresas = useTopEmpresas();

    if (overview.isLoading) return <LoadingSkeleton linhas={4} />;
    if (overview.isError || !overview.data) return <InlineError onRetry={() => void overview.refetch()} />;

    const o = overview.data;
    const serieVolume = volume.data?.serie ?? [];
    const ranking = topEmpresas.data?.ranking ?? [];

    return (
        <div className="overview">
            <section className="kpis-grid">
                <KpiCard label={t('overview.totalNFs')} valor={o.totalNFs} />
                <KpiCard label={t('overview.totalEmpresas')} valor={o.totalEmpresas} />
                <KpiCard label={t('overview.totalProdutos')} valor={o.totalProdutos} />
                <KpiCard label={t('overview.valorTotal')} valor={o.valorTotalProcessado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </section>

            <section className="chart">
                <h3>{t('overview.volumeTitulo')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={serieVolume}>
                        <XAxis dataKey="periodo" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="totalNFs" fill="#2563eb" name={t('overview.totalNFs')} />
                        <Line yAxisId="right" dataKey="valorTotal" stroke="#16a34a" name={t('overview.valorTotal')} />
                    </ComposedChart>
                </ResponsiveContainer>
            </section>

            <section className="chart">
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

            <section className="table-section">
                <h3>{t('overview.ultimasNFs')}</h3>
                <table className="data-table">
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
