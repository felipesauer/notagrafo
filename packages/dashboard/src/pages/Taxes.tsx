import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Receipt } from 'lucide-react';
import { useTaxStats } from '../api/hooks.js';
import { CurrencyValue, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { KpiCard } from '../components/KpiCard.js';
import { SortableHead } from '../components/SortableHead.js';
import { ChartCard } from '../components/charts/ChartCard.js';
import { ChartTooltip } from '../components/charts/ChartTooltip.js';
import { useTableSort } from '../hooks/useTableSort.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

const brl = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type NcmRow = { ncm: string; descricao?: string; totalImposto: number; vICMS: number };
type CfopRow = { cfop: string; descricao?: string; vICMS: number; vIPI: number };

/** Tabela Top NCM por imposto (ordenável, com deep-link para /nf?ncm=). */
function TopNcmTable({ rows }: { rows: NcmRow[] }): JSX.Element {
    const { t } = useTranslation();
    const { sorted, toggle, ariaSort } = useTableSort(rows, {
        ncm: (r) => r.ncm,
        totalImposto: (r) => r.totalImposto,
        vICMS: (r) => r.vICMS,
    });
    return (
        <Card className="overflow-hidden py-0">
            <CardHeader className="px-4 py-3"><CardTitle className="text-base"><h3>{t('impostos.topNcm')}</h3></CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
                {rows.length === 0 ? (
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{t('comum.vazio')}</p>
                ) : (
                    <Table data-testid="data-table">
                        <TableHeader>
                            <TableRow>
                                <SortableHead ariaSort={ariaSort('ncm')} onToggle={() => toggle('ncm')}>{t('nf.ncm')}</SortableHead>
                                <TableHead>{t('produtos.descricao')}</TableHead>
                                <SortableHead ariaSort={ariaSort('totalImposto')} onToggle={() => toggle('totalImposto')} align="right">{t('impostos.totalImposto')}</SortableHead>
                                <SortableHead ariaSort={ariaSort('vICMS')} onToggle={() => toggle('vICMS')} align="right">{t('nf.icms')}</SortableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((n) => (
                                <TableRow key={n.ncm}>
                                    <TableCell>
                                        <Link className="font-medium text-primary hover:underline tabular-nums" to={'/nf' as string} search={{ ncm: n.ncm } as never}>{n.ncm}</Link>
                                    </TableCell>
                                    <TableCell>{n.descricao ?? '—'}</TableCell>
                                    <TableCell className="text-right"><CurrencyValue value={n.totalImposto} /></TableCell>
                                    <TableCell className="text-right"><CurrencyValue value={n.vICMS} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

/** Tabela Top CFOP por imposto (ordenável). */
function TopCfopTable({ rows }: { rows: CfopRow[] }): JSX.Element {
    const { t } = useTranslation();
    const { sorted, toggle, ariaSort } = useTableSort(rows, {
        cfop: (r) => r.cfop,
        vICMS: (r) => r.vICMS,
        vIPI: (r) => r.vIPI,
    });
    return (
        <Card className="overflow-hidden py-0">
            <CardHeader className="px-4 py-3"><CardTitle className="text-base"><h3>{t('impostos.topCfop')}</h3></CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
                {rows.length === 0 ? (
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{t('comum.vazio')}</p>
                ) : (
                    <Table data-testid="data-table">
                        <TableHeader>
                            <TableRow>
                                <SortableHead ariaSort={ariaSort('cfop')} onToggle={() => toggle('cfop')}>{t('nf.cfop')}</SortableHead>
                                <TableHead>{t('produtos.descricao')}</TableHead>
                                <SortableHead ariaSort={ariaSort('vICMS')} onToggle={() => toggle('vICMS')} align="right">{t('nf.icms')}</SortableHead>
                                <SortableHead ariaSort={ariaSort('vIPI')} onToggle={() => toggle('vIPI')} align="right">{t('nf.ipi')}</SortableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((c) => (
                                <TableRow key={c.cfop}>
                                    <TableCell className="tabular-nums">{c.cfop}</TableCell>
                                    <TableCell>{c.descricao ?? '—'}</TableCell>
                                    <TableCell className="text-right"><CurrencyValue value={c.vICMS} /></TableCell>
                                    <TableCell className="text-right"><CurrencyValue value={c.vIPI} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

/** Página de Impostos: KPIs por tributo, série temporal e top NCM/CFOP (EPIC-11). */
export function TaxesPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTaxStats();

    if (isLoading) return <div><PageHeader title={t('impostos.titulo')} /><LoadingSkeleton variant="kpis" linhas={6} /></div>;
    if (isError || !data) return <div><PageHeader title={t('impostos.titulo')} /><InlineError onRetry={() => void refetch()} /></div>;

    const { totais, serie, topNcm, topCfop } = data;
    const semDados = serie.length === 0 && Object.values(totais).every((v) => !v);
    if (semDados) return <div><PageHeader title={t('impostos.titulo')} /><EmptyState mensagem={t('impostos.vazio')} /></div>;

    return (
        <div>
            <PageHeader title={t('impostos.titulo')} />
            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <KpiCard label={t('nf.icms')} value={brl(totais.vICMS)} icon={<Receipt />} />
                    <KpiCard label={t('impostos.icmsSt')} value={brl(totais.vICMSST)} icon={<Receipt />} />
                    <KpiCard label={t('nf.ipi')} value={brl(totais.vIPI)} icon={<Receipt />} />
                    <KpiCard label={t('nf.pis')} value={brl(totais.vPIS)} icon={<Receipt />} />
                    <KpiCard label={t('nf.cofins')} value={brl(totais.vCOFINS)} icon={<Receipt />} />
                    <KpiCard label={t('impostos.fcp')} value={brl(totais.vFCP)} icon={<Receipt />} />
                </section>

                <ChartCard title={t('impostos.serieTitulo')}>
                    <LineChart data={serie}>
                        <XAxis dataKey="periodo" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip formatValue={(v) => brl(Number(v))} />} />
                        <Legend />
                        <Line dataKey="vICMS" stroke="var(--chart-1)" strokeWidth={2} dot={false} name={t('nf.icms')} />
                        <Line dataKey="vIPI" stroke="var(--chart-2)" strokeWidth={2} dot={false} name={t('nf.ipi')} />
                        <Line dataKey="vPIS" stroke="var(--chart-3)" strokeWidth={2} dot={false} name={t('nf.pis')} />
                        <Line dataKey="vCOFINS" stroke="var(--chart-4)" strokeWidth={2} dot={false} name={t('nf.cofins')} />
                    </LineChart>
                </ChartCard>

                <div className="grid gap-6 lg:grid-cols-2">
                    <TopNcmTable rows={topNcm} />
                    <TopCfopTable rows={topCfop} />
                </div>
            </div>
        </div>
    );
}
