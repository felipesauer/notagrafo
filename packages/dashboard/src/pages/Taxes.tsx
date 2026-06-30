import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useTaxStats } from '../api/hooks.js';
import { CurrencyValue, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';

function KpiCard({ label, valor }: { label: string; valor: number }): JSX.Element {
    return (
        <div className="kpi-card">
            <span className="kpi-card__label">{label}</span>
            <strong className="kpi-card__valor"><CurrencyValue value={valor} /></strong>
        </div>
    );
}

const brl = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Página de Impostos: KPIs por tributo, série temporal e top NCM/CFOP (EPIC-11). */
export function TaxesPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTaxStats();

    if (isLoading) return <LoadingSkeleton linhas={4} />;
    if (isError || !data) return <InlineError onRetry={() => void refetch()} />;

    const { totais, serie, topNcm, topCfop } = data;
    // Sem nenhum imposto registrado em toda a base → estado vazio.
    const semDados = serie.length === 0 && Object.values(totais).every((v) => !v);
    if (semDados) return <EmptyState mensagem={t('impostos.vazio')} />;

    return (
        <div className="impostos">
            <h2>{t('impostos.titulo')}</h2>

            <section className="kpis-grid">
                <KpiCard label={t('nf.icms')} valor={totais.vICMS} />
                <KpiCard label={t('impostos.icmsSt')} valor={totais.vICMSST} />
                <KpiCard label={t('nf.ipi')} valor={totais.vIPI} />
                <KpiCard label={t('nf.pis')} valor={totais.vPIS} />
                <KpiCard label={t('nf.cofins')} valor={totais.vCOFINS} />
                <KpiCard label={t('impostos.fcp')} valor={totais.vFCP} />
            </section>

            <section className="chart">
                <h3>{t('impostos.serieTitulo')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={serie}>
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip formatter={(v) => brl(Number(v))} />
                        <Legend />
                        <Line dataKey="vICMS" stroke="#2563eb" name={t('nf.icms')} />
                        <Line dataKey="vIPI" stroke="#16a34a" name={t('nf.ipi')} />
                        <Line dataKey="vPIS" stroke="#d97706" name={t('nf.pis')} />
                        <Line dataKey="vCOFINS" stroke="#dc2626" name={t('nf.cofins')} />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            <div className="impostos__rankings">
                <section className="table-section">
                    <h3>{t('impostos.topNcm')}</h3>
                    {topNcm.length === 0 ? (
                        <p className="empty-hint">{t('comum.vazio')}</p>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr><th>{t('nf.ncm')}</th><th>{t('produtos.descricao')}</th><th>{t('impostos.totalImposto')}</th><th>{t('nf.icms')}</th></tr>
                                </thead>
                                <tbody>
                                    {topNcm.map((n) => (
                                        <tr key={n.ncm}>
                                            <td>{n.ncm}</td>
                                            <td>{n.descricao ?? '—'}</td>
                                            <td><CurrencyValue value={n.totalImposto} /></td>
                                            <td><CurrencyValue value={n.vICMS} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="table-section">
                    <h3>{t('impostos.topCfop')}</h3>
                    {topCfop.length === 0 ? (
                        <p className="empty-hint">{t('comum.vazio')}</p>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr><th>{t('nf.cfop')}</th><th>{t('produtos.descricao')}</th><th>{t('nf.icms')}</th><th>{t('nf.ipi')}</th></tr>
                                </thead>
                                <tbody>
                                    {topCfop.map((c) => (
                                        <tr key={c.cfop}>
                                            <td>{c.cfop}</td>
                                            <td>{c.descricao ?? '—'}</td>
                                            <td><CurrencyValue value={c.vICMS} /></td>
                                            <td><CurrencyValue value={c.vIPI} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
