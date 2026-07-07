import { type JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
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
import { useOverview, useVolume, useTopCompanies, useByUf, useTaxStats, usePeriodComparison, type PeriodComparison } from '../api/hooks.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { NFRowActions } from '../components/NFRowActions.js';
import { SortableHead } from '../components/SortableHead.js';
import { useTableSort } from '../hooks/useTableSort.js';
import { useDensityStore, densityClass } from '../stores/density.store.js';
import { KpiCard } from '../components/KpiCard.js';
import { FadeIn } from '../components/Motion.js';
import { ChartCard } from '../components/charts/ChartCard.js';
import { BarList, type BarItem } from '../components/charts/BarList.js';
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
    canceladas: { label: 'Canceladas', color: 'var(--status-cancelada)' },
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
    // Comparativo dos últimos 30 dias vs os 30 anteriores (EPIC-26) — variação
    // real nos KPIs, no lugar da tendência interna da série. Datas em useMemo
    // para não recriar a cada render (Date.now indireto via janela fixa de hoje).
    const { compStart, compEnd } = useMemo(() => {
        const today = new Date();
        const end = today.toISOString().slice(0, 10);
        const start = new Date(today.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);
        return { compStart: start, compEnd: end };
    }, []);
    const comparison = usePeriodComparison(compStart, compEnd);

    return (
        // canvas: moldura de report (estilo Power BI). Um gradiente sutil +
        // inset ring dá separação dos cartões nos DOIS temas — no claro o
        // bg-muted/20 chapado quase sumia contra os cartões brancos. A margem
        // negativa anula o padding do <main> (p-4 md:p-6 lg:p-8) para o canvas
        // sangrar até as bordas; deve acompanhar o padding do shell (ADR-17).
        <div className="-m-4 min-h-[calc(100svh-3rem)] bg-gradient-to-b from-muted/50 to-muted/20 p-4 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.04),inset_0_0_0_1px_var(--border)] md:-m-6 md:p-6 lg:-m-8 lg:p-8">
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
                    comparison={comparison.data}
                    gran={gran}
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
    comparison,
    gran,
}: {
    o: NonNullable<OverviewData>;
    volumeSeries: { periodo: string; totalNFs: number; valorTotal: number; canceladas?: number }[];
    ranking: { cnpj: string; razaoSocial: string; valorTotal: number }[];
    byUf: ByUfQuery;
    taxTotals?: TaxTotals;
    comparison?: PeriodComparison;
    gran: Gran;
}): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const density = useDensityStore((s) => s.density);
    // Ordenação client-side das Últimas NFs (dataset fixo de 10 — sem paginação).
    const ultimasSort = useTableSort(o.ultimasProcessadas, {
        numero: (nf) => nf.numero,
        emitente: (nf) => nf.emitente?.razaoSocial ?? '',
        valorTotal: (nf) => nf.valorTotal,
        status: (nf) => nf.status ?? '',
        processadaEm: (nf) => nf.processadaEm,
    });

    const nfSpark = useMemo(() => volumeSeries.map((s) => s.totalNFs), [volumeSeries]);
    const valSpark = useMemo(() => volumeSeries.map((s) => s.valorTotal), [volumeSeries]);
    const cargaTotal = taxTotals
        ? taxTotals.vICMS + taxTotals.vICMSST + taxTotals.vIPI + taxTotals.vPIS + taxTotals.vCOFINS + taxTotals.vFCP
          + taxTotals.vIBS + taxTotals.vCBS + taxTotals.vIS
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
              // Reforma Tributária — só aparecem quando houver valor (transição).
              { key: 'IBS', valor: taxTotals.vIBS },
              { key: 'CBS', valor: taxTotals.vCBS },
              { key: 'IS', valor: taxTotals.vIS },
          ].filter((d) => d.valor > 0))
        : [];

    // KPI delta: real change of the last 30d vs the previous 30d (comparison).
    // Falls back to the in-series trend while loading or when there is no
    // baseline (empty previous period → change is undefined).
    const deltaNFs = comparison?.changeVsPrevious.totalNFs ?? trend(nfSpark);
    const deltaValor = comparison?.changeVsPrevious.valorTotal ?? trend(valSpark);
    const deltaHint = comparison ? t('overview.vs30d') : t('overview.periodoAnterior');

    // Drill-down temporal (EPIC-26): clicar numa barra/ponto do gráfico de volume
    // abre o Explorer filtrado pela janela de data daquele período. O rótulo
    // `periodo` da série varia por granularidade (dia=YYYY-MM-DD, mês=YYYY-MM…).
    function periodWindow(periodo: string): { dataEmissaoInicio: string; dataEmissaoFim: string } | null {
        if (!periodo) return null;
        if (gran === 'mes') {
            // YYYY-MM → primeiro ao último dia do mês
            const [y, m] = periodo.split('-').map(Number);
            if (!y || !m) return null;
            const inicio = `${periodo}-01`;
            const fim = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // dia 0 do mês seguinte = último dia
            return { dataEmissaoInicio: inicio, dataEmissaoFim: fim };
        }
        if (gran === 'semana') {
            // YYYY-MM-DD (início da semana) → +6 dias
            const fim = new Date(new Date(periodo + 'T00:00:00Z').getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
            return { dataEmissaoInicio: periodo, dataEmissaoFim: fim };
        }
        // dia (ou hora): o próprio dia
        return { dataEmissaoInicio: periodo.slice(0, 10), dataEmissaoFim: periodo.slice(0, 10) };
    }
    function drillToPeriod(periodo: string): void {
        const w = periodWindow(periodo);
        if (!w) return;
        void navigate({ to: '/explore' as string, search: { entity: 'notas', ...w } as never });
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* ── KPIs headline (topo, zona F) — entram em stagger sutil ── */}
            <FadeIn className="sm:col-span-6 lg:col-span-3" delay={0}>
                <KpiCard
                    label={t('overview.totalNFs')}
                    value={o.totalNFs.toLocaleString('pt-BR')}
                    icon={<FileText />}
                    delta={deltaNFs}
                    hint={deltaHint}
                    spark={nfSpark}
                    sparkColor="var(--chart-1)"
                />
            </FadeIn>
            <FadeIn className="sm:col-span-6 lg:col-span-3" delay={0.05}>
                <KpiCard
                    label={t('overview.valorTotal')}
                    value={brlCompact(o.valorTotalProcessado)}
                    icon={<Receipt />}
                    delta={deltaValor}
                    hint={deltaHint}
                    spark={valSpark}
                    sparkColor="var(--chart-3)"
                />
            </FadeIn>
            <FadeIn className="sm:col-span-6 lg:col-span-3" delay={0.1}>
                <KpiCard
                    label={t('overview.totalEmpresas')}
                    value={o.totalEmpresas.toLocaleString('pt-BR')}
                    icon={<Building2 />}
                    hint={t('overview.empresasHint', { count: o.totalEmpresas })}
                />
            </FadeIn>
            <FadeIn className="sm:col-span-6 lg:col-span-3" delay={0.15}>
                <KpiCard
                    label={t('overview.totalProdutos')}
                    value={o.totalProdutos.toLocaleString('pt-BR')}
                    icon={<Package />}
                    hint={cargaTotal > 0 ? t('overview.cargaHint', { valor: brlCompact(cargaTotal) }) : undefined}
                />
            </FadeIn>

            {/* ── Área grande: volume + valor (8 col) ── */}
            <FadeIn className="h-full sm:col-span-12 lg:col-span-8" delay={0.2}>
                <ChartCard title={t('overview.volumeTitulo')} config={volumeConfig} className="h-[280px] w-full">
                    <ComposedChart
                        data={volumeSeries}
                        margin={{ left: 4, right: 8, top: 8 }}
                        onClick={(e: { activeLabel?: string | number }) => { if (e?.activeLabel != null) drillToPeriod(String(e.activeLabel)); }}
                        className="cursor-pointer"
                    >
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
                        <Bar yAxisId="l" dataKey="canceladas" fill="var(--color-canceladas)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                        <Line yAxisId="r" dataKey="valorTotal" type="monotone" stroke="var(--color-valorTotal)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ChartCard>
            </FadeIn>

            {/* ── Donut composição tributária (4 col) ── */}
            <FadeIn className="h-full sm:col-span-12 lg:col-span-4" delay={0.25}>
                <Card data-testid="chart" className="h-full gap-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <h3 className="text-base leading-none font-semibold">{t('overview.composicaoTributaria')}</h3>
                        <span className="text-xs text-muted-foreground tabular-nums">{brlCompact(cargaTotal)}</span>
                    </CardHeader>
                    <CardContent>
                        {taxPie.length === 0 ? (
                            <EmptyState mensagem={t('impostos.vazio')} />
                        ) : (
                            <div className="flex items-center justify-between gap-6">
                                <ChartContainer config={{}} className="aspect-square h-[168px] w-[168px] shrink-0">
                                    <PieChart>
                                        <Pie data={taxPie} dataKey="valor" nameKey="key" innerRadius={50} outerRadius={82} strokeWidth={2} stroke="var(--background)">
                                            {taxPie.map((_, i) => <Cell key={i} fill={chartColor(i)} />)}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel formatter={(v) => brl(Number(v))} />} />
                                    </PieChart>
                                </ChartContainer>
                                <ul className="flex flex-1 flex-col justify-center gap-2">
                                    {taxPie.map((d, i) => (
                                        <li key={d.key} className="grid grid-cols-[10px_1fr_auto] items-center gap-2.5 text-2sm">
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
            <FadeIn className="h-full sm:col-span-12 lg:col-span-5" delay={0.3}>
                <Card data-testid="chart" className="h-full gap-4">
                    <CardHeader className="space-y-0"><h3 className="text-base leading-none font-semibold">{t('overview.topFornecedores')}</h3></CardHeader>
                    <CardContent>
                        {rankTop.length === 0 ? <EmptyState /> : (
                            <BarList
                                items={rankTop.map<BarItem>((e) => ({
                                    id: e.cnpj || e.nome,
                                    label: e.nome,
                                    value: e.valorTotal,
                                    hint: brlCompact(e.valorTotal),
                                    to: '/explore',
                                    search: { entity: 'notas', cnpjEmitente: e.cnpj },
                                    ariaLabel: t('overview.verNotasFornecedor', { nome: e.nome }),
                                }))}
                                fixedColor="var(--chart-3)"
                            />
                        )}
                    </CardContent>
                </Card>
            </FadeIn>

            {/* ── Distribuição por UF — treemap denso (7 col) ── */}
            <FadeIn className="h-full sm:col-span-12 lg:col-span-7" delay={0.35}>
                <Card data-testid="chart" className="h-full gap-4">
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
                            <BarList
                                colorByIndex
                                items={treemapUf.map<BarItem>((u) => ({
                                    id: u.uf,
                                    label: u.uf,
                                    tag: u.uf,
                                    value: u.size,
                                    hint: u.valorTotal >= 1000 ? `R$ ${(u.valorTotal / 1000).toFixed(0)}k` : `R$ ${u.valorTotal.toFixed(0)}`,
                                    to: '/explore',
                                    search: { entity: 'notas', ufEmitente: u.uf },
                                    ariaLabel: t('overview.verNotasUf', { uf: u.uf }),
                                }))}
                                formatValue={(v) => String(v)}
                            />
                        )}
                    </CardContent>
                </Card>
            </FadeIn>

            {/* ── Últimas NFs (largura total) ── */}
            <FadeIn className="sm:col-span-12 lg:col-span-12" delay={0.4}>
                <Card className="py-4">
                    <CardContent className="px-4">
                        <h3 className="mb-3 text-base font-semibold">{t('overview.ultimasNFs')}</h3>
                        {o.ultimasProcessadas.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <Table data-testid="data-table" data-zebra className={densityClass(density)}>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHead sortKey="numero" ariaSort={ultimasSort.ariaSort} onToggle={ultimasSort.toggle} className="w-16">{t('overview.numero')}</SortableHead>
                                        <SortableHead sortKey="emitente" ariaSort={ultimasSort.ariaSort} onToggle={ultimasSort.toggle}>{t('nf.emitente')}</SortableHead>
                                        <SortableHead sortKey="valorTotal" ariaSort={ultimasSort.ariaSort} onToggle={ultimasSort.toggle} align="right" className="text-right">{t('overview.valor')}</SortableHead>
                                        <SortableHead sortKey="status" ariaSort={ultimasSort.ariaSort} onToggle={ultimasSort.toggle}>{t('nf.status')}</SortableHead>
                                        <SortableHead sortKey="processadaEm" ariaSort={ultimasSort.ariaSort} onToggle={ultimasSort.toggle}>{t('overview.processadaEm')}</SortableHead>
                                        <TableHead className="w-[104px] text-right">{t('nf.acoes')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ultimasSort.sorted.map((nf) => (
                                        <TableRow
                                            key={nf.chaveAcesso}
                                            className="cursor-pointer"
                                            onClick={() => void navigate({ to: '/invoice/$chave' as string, params: { chave: nf.chaveAcesso } as never })}
                                        >
                                            <TableCell className="font-mono font-medium tabular-nums text-primary">{nf.numero}</TableCell>
                                            <TableCell>
                                                {nf.emitente
                                                    ? <span className="truncate">{nf.emitente.razaoSocial || '—'}{nf.emitente.uf ? <span className="ml-1 font-mono text-2xs text-muted-foreground">· {nf.emitente.uf}</span> : null}</span>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                            <TableCell>{nf.status ? <NFStatusBadge status={nf.status} /> : '—'}</TableCell>
                                            <TableCell className="font-mono text-muted-foreground tabular-nums"><DateDisplay value={nf.processadaEm} /></TableCell>
                                            <TableCell><NFRowActions chave={nf.chaveAcesso} cnpjEmitente={nf.emitente?.cnpj} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </FadeIn>
        </div>
    );
}

