import { type JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Line,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import { Building2, FileText, Package, Receipt } from 'lucide-react';
import { useOverview, useVolume, useTopCompanies, useByUf, useTaxStats } from '../api/hooks.js';
import { CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { KpiCard } from '../components/KpiCard.js';
import { FadeIn } from '../components/Motion.js';
import { ChartCard } from '../components/charts/ChartCard.js';
import { chartColor } from '../components/charts/palette.js';
import { Card, CardContent, CardHeader } from '../components/ui/card.js';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../components/ui/chart.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

const brl = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = (v: number): string =>
    v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : brl(v);

/** Delta fracionário entre a 2ª e a 1ª metade de uma série (tendência recente). */
function trend(series: number[]): number | undefined {
    if (series.length < 4) return undefined;
    const mid = Math.floor(series.length / 2);
    const a = series.slice(0, mid).reduce((s, v) => s + v, 0);
    const b = series.slice(mid).reduce((s, v) => s + v, 0);
    if (a === 0) return undefined;
    return (b - a) / a;
}

const volumeConfig = {
    totalNFs: { label: 'NF-e', color: 'var(--chart-1)' },
    valorTotal: { label: 'Valor', color: 'var(--chart-3)' },
} satisfies ChartConfig;

type Gran = 'dia' | 'semana' | 'mes';

/** Barra de report (estilo Power BI): título + seletor de granularidade que
 *  controla a série temporal do canvas. */
function ReportBar({ gran, onGran }: { gran: Gran; onGran: (g: Gran) => void }): JSX.Element {
    const { t } = useTranslation();
    const opts: Gran[] = ['dia', 'semana', 'mes'];
    return (
        <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight">{t('overview.titulo')}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t('overview.subtitulo')}</p>
            </div>
            <div className="ml-auto inline-flex rounded-lg border bg-muted/40 p-0.5">
                {opts.map((g) => (
                    <button key={g} type="button" onClick={() => onGran(g)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${gran === g ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        {t(`overview.gran.${g}`)}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Página de visão geral: report BI (estilo Power BI) com KPIs, canvas de charts
 *  em bento grid e filtro de período que controla a série temporal. */
export function OverviewPage(): JSX.Element {
    const [gran, setGran] = useState<Gran>('dia');
    const overview = useOverview();
    const volume = useVolume(gran);
    const topCompanies = useTopCompanies();
    const byUf = useByUf('emitente');
    const taxes = useTaxStats();

    return (
        // canvas: moldura de report (estilo Power BI). Um gradiente sutil +
        // inset ring dá separação dos cartões nos DOIS temas — no claro o
        // bg-muted/20 chapado quase sumia contra os cartões brancos.
        <div className="-m-4 min-h-[calc(100svh-3rem)] bg-gradient-to-b from-muted/50 to-muted/20 p-4 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.04),inset_0_0_0_1px_var(--border)] md:-m-6 md:p-6">
            <ReportBar gran={gran} onGran={setGran} />
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
                    taxTotals={taxes.data?.totais}
                />
            )}
        </div>
    );
}

type OverviewData = ReturnType<typeof useOverview>['data'];
type ByUfQuery = ReturnType<typeof useByUf>;
type TaxTotals = NonNullable<ReturnType<typeof useTaxStats>['data']>['totais'];

function OverviewContent({
    o,
    volumeSeries,
    ranking,
    byUf,
    taxTotals,
}: {
    o: NonNullable<OverviewData>;
    volumeSeries: { periodo: string; totalNFs: number; valorTotal: number }[];
    ranking: { cnpj: string; razaoSocial: string; valorTotal: number }[];
    byUf: ByUfQuery;
    taxTotals?: TaxTotals;
}): JSX.Element {
    const { t } = useTranslation();

    const nfSpark = useMemo(() => volumeSeries.map((s) => s.totalNFs), [volumeSeries]);
    const valSpark = useMemo(() => volumeSeries.map((s) => s.valorTotal), [volumeSeries]);
    const cargaTotal = taxTotals
        ? taxTotals.vICMS + taxTotals.vICMSST + taxTotals.vIPI + taxTotals.vPIS + taxTotals.vCOFINS + taxTotals.vFCP
        : 0;

    const treemapUf = (byUf.data?.porUf ?? []).map((u) => ({ name: u.uf, uf: u.uf, size: u.totalNFs, valorTotal: u.valorTotal }));
    const rankTop = ranking.slice(0, 5).map((e) => ({ nome: e.razaoSocial, cnpj: e.cnpj, valorTotal: e.valorTotal }));

    // Composição tributária para o donut.
    const taxPie = taxTotals
        ? ([
              { key: 'ICMS', valor: taxTotals.vICMS },
              { key: 'COFINS', valor: taxTotals.vCOFINS },
              { key: 'IPI', valor: taxTotals.vIPI },
              { key: 'ICMS-ST', valor: taxTotals.vICMSST },
              { key: 'PIS', valor: taxTotals.vPIS },
              { key: 'FCP', valor: taxTotals.vFCP },
          ].filter((d) => d.valor > 0))
        : [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* ── KPIs headline (topo, zona F) — entram em stagger sutil ── */}
            <FadeIn className="lg:col-span-3" delay={0}>
                <KpiCard
                    label={t('overview.totalNFs')}
                    value={o.totalNFs.toLocaleString('pt-BR')}
                    icon={<FileText />}
                    delta={trend(nfSpark)}
                    hint={t('overview.periodoAnterior')}
                    spark={nfSpark}
                    sparkColor="var(--chart-1)"
                />
            </FadeIn>
            <FadeIn className="lg:col-span-3" delay={0.05}>
                <KpiCard
                    label={t('overview.valorTotal')}
                    value={brlCompact(o.valorTotalProcessado)}
                    icon={<Receipt />}
                    delta={trend(valSpark)}
                    hint={t('overview.periodoAnterior')}
                    spark={valSpark}
                    sparkColor="var(--chart-3)"
                />
            </FadeIn>
            <FadeIn className="lg:col-span-3" delay={0.1}>
                <KpiCard
                    label={t('overview.totalEmpresas')}
                    value={o.totalEmpresas.toLocaleString('pt-BR')}
                    icon={<Building2 />}
                    hint={t('overview.empresasHint', { count: o.totalEmpresas })}
                />
            </FadeIn>
            <FadeIn className="lg:col-span-3" delay={0.15}>
                <KpiCard
                    label={t('overview.totalProdutos')}
                    value={o.totalProdutos.toLocaleString('pt-BR')}
                    icon={<Package />}
                    hint={cargaTotal > 0 ? t('overview.cargaHint', { valor: brlCompact(cargaTotal) }) : undefined}
                />
            </FadeIn>

            {/* ── Área grande: volume + valor (8 col) ── */}
            <FadeIn className="lg:col-span-8" delay={0.2}>
                <ChartCard title={t('overview.volumeTitulo')} config={volumeConfig} className="h-[280px] w-full">
                    <ComposedChart data={volumeSeries} margin={{ left: 4, right: 8, top: 8 }}>
                        <defs>
                            <linearGradient id="ov-val" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-valorTotal)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="var(--color-valorTotal)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" tickLine={false} axisLine={false} fontSize={11} minTickGap={32} />
                        <YAxis yAxisId="l" tickLine={false} axisLine={false} fontSize={11} width={32} />
                        <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={11} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Bar yAxisId="l" dataKey="totalNFs" fill="var(--color-totalNFs)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                        <Line yAxisId="r" dataKey="valorTotal" type="monotone" stroke="var(--color-valorTotal)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ChartCard>
            </FadeIn>

            {/* ── Donut composição tributária (4 col) ── */}
            <FadeIn className="lg:col-span-4" delay={0.25}>
                <Card data-testid="chart" className="gap-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <h3 className="text-base leading-none font-semibold">{t('overview.composicaoTributaria')}</h3>
                        <span className="text-xs text-muted-foreground tabular-nums">{brlCompact(cargaTotal)}</span>
                    </CardHeader>
                    <CardContent>
                        {taxPie.length === 0 ? (
                            <EmptyState mensagem={t('impostos.vazio')} />
                        ) : (
                            <div className="flex items-center gap-4">
                                <ChartContainer config={{}} className="h-[150px] w-[150px] shrink-0">
                                    <PieChart>
                                        <Pie data={taxPie} dataKey="valor" nameKey="key" innerRadius={45} outerRadius={70} strokeWidth={2} stroke="var(--background)">
                                            {taxPie.map((_, i) => <Cell key={i} fill={chartColor(i)} />)}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel formatter={(v) => brl(Number(v))} />} />
                                    </PieChart>
                                </ChartContainer>
                                <ul className="flex-1 space-y-1.5">
                                    {taxPie.map((d, i) => (
                                        <li key={d.key} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-xs">
                                            <span className="size-2.5 rounded-[3px]" style={{ background: chartColor(i) }} />
                                            <span className="text-muted-foreground">{d.key}</span>
                                            <span className="font-medium tabular-nums">{brlCompact(d.valor)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </FadeIn>

            {/* ── Ranking fornecedores (5 col) — cada linha faz drill-through para
                   o Explorer filtrado pelo CNPJ do emitente ── */}
            <FadeIn className="lg:col-span-5" delay={0.3}>
                <Card data-testid="chart" className="gap-4">
                    <CardHeader className="space-y-0"><h3 className="text-base leading-none font-semibold">{t('overview.topFornecedores')}</h3></CardHeader>
                    <CardContent>
                        {rankTop.length === 0 ? <EmptyState /> : <FornecedorBars data={rankTop} />}
                    </CardContent>
                </Card>
            </FadeIn>

            {/* ── Distribuição por UF — treemap denso (7 col) ── */}
            <FadeIn className="lg:col-span-7" delay={0.35}>
                <Card data-testid="chart" className="gap-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <h3 className="text-base leading-none font-semibold">{t('overview.distribuicaoUf')}</h3>
                        <span className="text-xs text-muted-foreground">{t('overview.porUfHint')}</span>
                    </CardHeader>
                    <CardContent>
                        {byUf.isLoading ? (
                            <LoadingSkeleton variant="card" />
                        ) : byUf.isError ? (
                            <InlineError onRetry={() => void byUf.refetch()} />
                        ) : treemapUf.length === 0 ? (
                            <EmptyState mensagem={t('overview.distribuicaoUfVazio')} />
                        ) : (
                            <UfBars data={treemapUf} />
                        )}
                    </CardContent>
                </Card>
            </FadeIn>

            {/* ── Últimas NFs (largura total) ── */}
            <FadeIn className="lg:col-span-12" delay={0.4}>
                <Card className="py-4">
                    <CardContent className="px-4">
                        <h3 className="mb-3 text-base font-semibold">{t('overview.ultimasNFs')}</h3>
                        {o.ultimasProcessadas.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="overflow-x-auto">
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
                                                <Link className="font-medium text-primary hover:underline" to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}>{nf.numero}</Link>
                                            </TableCell>
                                            <TableCell className="text-right"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                            <TableCell><DateDisplay value={nf.processadaEm} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </FadeIn>
        </div>
    );
}

/** Barras horizontais densas por UF. A barra e o número dentro dela representam
 *  a MESMA métrica (nº de NF-e, o eixo declarado no hint); o valor em R$ fica à
 *  direita como contexto secundário, tipograficamente subordinado, para não
 *  competir com a barra (barra curta + R$ alto lia como inconsistência).
 *  Cada linha é um drill-through: leva ao Explorer filtrado por UF do emitente. */
function UfBars({ data }: { data: { uf: string; size: number; valorTotal: number }[] }): JSX.Element {
    const { t } = useTranslation();
    const max = Math.max(...data.map((d) => d.size), 1);
    const fmtValor = (v: number): string => (v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`);
    return (
        <div className="space-y-1">
            {data.map((d, i) => (
                <Link
                    key={d.uf}
                    to={'/explorar' as string}
                    search={{ entity: 'notas', ufEmitente: d.uf } as never}
                    aria-label={t('overview.verNotasUf', { uf: d.uf })}
                    className="grid grid-cols-[32px_1fr_88px] items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">{d.uf}</span>
                    <div className="h-6 overflow-hidden rounded bg-muted/50">
                        <div className="flex h-full items-center justify-end rounded pr-2 text-[11px] font-semibold text-white tabular-nums" style={{ width: `${Math.max((d.size / max) * 100, 14)}%`, background: chartColor(i) }}>
                            {d.size}
                        </div>
                    </div>
                    <span className="text-right text-xs tabular-nums text-muted-foreground/70">{fmtValor(d.valorTotal)}</span>
                </Link>
            ))}
        </div>
    );
}

/** Ranking de fornecedores como barras-Link: cada linha leva ao Explorer
 *  filtrado pelo CNPJ do emitente (drill-through). Escala por valor faturado. */
function FornecedorBars({ data }: { data: { nome: string; cnpj: string; valorTotal: number }[] }): JSX.Element {
    const { t } = useTranslation();
    const max = Math.max(...data.map((d) => d.valorTotal), 1);
    return (
        <div className="space-y-1">
            {data.map((d) => (
                <Link
                    key={d.cnpj || d.nome}
                    to={'/explorar' as string}
                    search={{ entity: 'notas', cnpjEmitente: d.cnpj } as never}
                    aria-label={t('overview.verNotasFornecedor', { nome: d.nome })}
                    className="group grid grid-cols-[1fr_auto] items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{d.nome}</p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/50">
                            <div className="h-full rounded-full bg-[var(--chart-3)]" style={{ width: `${Math.max((d.valorTotal / max) * 100, 4)}%` }} />
                        </div>
                    </div>
                    <span className="shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{brlCompact(d.valorTotal)}</span>
                </Link>
            ))}
        </div>
    );
}
