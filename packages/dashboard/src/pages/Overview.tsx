import { type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import {
    Bar,
    BarChart,
    ComposedChart,
    Line,
    Tooltip,
    Treemap,
    XAxis,
    YAxis,
} from 'recharts';
import { Building2, FileText, Package, Wallet } from 'lucide-react';
import { useOverview, useVolume, useTopCompanies, useByUf } from '../api/hooks.js';
import { CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { ChartCard } from '../components/charts/ChartCard.js';
import { ChartTooltip } from '../components/charts/ChartTooltip.js';
import { chartColor } from '../components/charts/palette.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

const brl = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function KpiCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }): JSX.Element {
    return (
        <Card data-testid="kpi-card" className="gap-0 py-4">
            <CardContent className="flex items-center gap-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&>svg]:size-4.5">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

interface TreemapCellProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    uf?: string;
}

/** Célula do Treemap: cor tokenizada por índice; borda na cor de fundo. */
function UfCell({ x = 0, y = 0, width = 0, height = 0, index = 0, uf }: TreemapCellProps): JSX.Element {
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={chartColor(index)} stroke="var(--background)" strokeWidth={2} rx={2} />
            {width > 40 && height > 20 && uf ? (
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={12} fontWeight={600}>
                    {uf}
                </text>
            ) : null}
        </g>
    );
}

/** Página de visão geral: KPIs, gráficos Recharts e últimas NFs. */
export function OverviewPage(): JSX.Element {
    const { t } = useTranslation();
    const overview = useOverview();
    const volume = useVolume('dia');
    const topCompanies = useTopCompanies();
    const byUf = useByUf('emitente');

    return (
        <div>
            <PageHeader title={t('overview.titulo')} />

            {overview.isLoading ? (
                <LoadingSkeleton variant="kpis" linhas={4} />
            ) : overview.isError || !overview.data ? (
                <InlineError onRetry={() => void overview.refetch()} />
            ) : (
                <OverviewContent
                    o={overview.data}
                    volumeSeries={volume.data?.serie ?? []}
                    ranking={topCompanies.data?.ranking ?? []}
                    byUf={byUf}
                />
            )}
        </div>
    );
}

type OverviewData = ReturnType<typeof useOverview>['data'];
type ByUfQuery = ReturnType<typeof useByUf>;

function OverviewContent({
    o,
    volumeSeries,
    ranking,
    byUf,
}: {
    o: NonNullable<OverviewData>;
    volumeSeries: { periodo: string; totalNFs: number; valorTotal: number }[];
    ranking: { razaoSocial: string; valorTotal: number }[];
    byUf: ByUfQuery;
}): JSX.Element {
    const { t } = useTranslation();
    const treemapUf = (byUf.data?.porUf ?? []).map((u) => ({ name: u.uf, uf: u.uf, size: u.totalNFs, valorTotal: u.valorTotal }));

    return (
        <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label={t('overview.totalNFs')} value={o.totalNFs.toLocaleString('pt-BR')} icon={<FileText />} />
                <KpiCard label={t('overview.totalEmpresas')} value={o.totalEmpresas.toLocaleString('pt-BR')} icon={<Building2 />} />
                <KpiCard label={t('overview.totalProdutos')} value={o.totalProdutos.toLocaleString('pt-BR')} icon={<Package />} />
                <KpiCard label={t('overview.valorTotal')} value={brl(o.valorTotalProcessado)} icon={<Wallet />} />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <ChartCard title={t('overview.volumeTitulo')}>
                        <ComposedChart data={volumeSeries}>
                            <XAxis dataKey="periodo" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                            <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltip formatValue={(v, name) => (name === t('overview.valorTotal') ? brl(Number(v)) : String(v))} />} />
                            <Bar yAxisId="left" dataKey="totalNFs" fill="var(--chart-1)" name={t('overview.totalNFs')} radius={[3, 3, 0, 0]} />
                            <Line yAxisId="right" dataKey="valorTotal" stroke="var(--chart-2)" strokeWidth={2} dot={false} name={t('overview.valorTotal')} />
                        </ComposedChart>
                    </ChartCard>
                </div>

                <ChartCard title={t('overview.topFornecedores')}>
                    <BarChart data={ranking} layout="vertical" margin={{ left: 12 }}>
                        <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="razaoSocial" width={150} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip formatValue={(v) => brl(Number(v))} />} />
                        <Bar dataKey="valorTotal" fill="var(--chart-1)" radius={[0, 3, 3, 0]} name={t('overview.valorTotal')} />
                    </BarChart>
                </ChartCard>

                <ChartCard title={t('overview.distribuicaoUf')}>
                    {byUf.isLoading ? (
                        <LoadingSkeleton variant="card" />
                    ) : byUf.isError ? (
                        <InlineError onRetry={() => void byUf.refetch()} />
                    ) : treemapUf.length === 0 ? (
                        <EmptyState mensagem={t('overview.distribuicaoUfVazio')} />
                    ) : (
                        <Treemap data={treemapUf} dataKey="size" nameKey="name" content={<UfCell />}>
                            <Tooltip
                                content={
                                    <ChartTooltip
                                        formatValue={(value, _name) => `${String(value)} NFs`}
                                        formatLabel={(l) => String(l)}
                                    />
                                }
                            />
                        </Treemap>
                    )}
                </ChartCard>
            </div>

            <Card className="py-4">
                <CardContent className="px-4">
                    <h3 className="mb-3 text-base font-semibold">{t('overview.ultimasNFs')}</h3>
                    {o.ultimasProcessadas.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <Table data-testid="data-table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('overview.numero')}</TableHead>
                                    <TableHead className="text-right">{t('overview.valor')}</TableHead>
                                    <TableHead>{t('overview.processadaEm')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {o.ultimasProcessadas.map((nf) => (
                                    <TableRow key={nf.chaveAcesso}>
                                        <TableCell>
                                            <Link
                                                className="font-medium text-primary hover:underline"
                                                to={'/nf/$chave' as string}
                                                params={{ chave: nf.chaveAcesso } as never}
                                            >
                                                {nf.numero}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                        <TableCell><DateDisplay value={nf.processadaEm} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
