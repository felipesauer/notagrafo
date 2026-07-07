import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Link } from '@tanstack/react-router';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTaxStats, type TaxStats } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { chartColor } from '../../components/charts/palette.js';
import { Card, CardContent, CardHeader } from '../../components/ui/card.js';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../../components/ui/chart.js';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table.js';
import { SortableHead } from '../../components/SortableHead.js';
import { TablePagination } from '../../components/TablePagination.js';
import { useClientTable } from '../../hooks/useClientTable.js';
import { useDensityStore, densityClass, type Density } from '../../stores/density.store.js';

const brlK = (n: number): string => (n >= 1000 ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${n.toFixed(2)}`);

const serieConfig = {
    vICMS: { label: 'ICMS', color: 'var(--chart-1)' },
    vIPI: { label: 'IPI', color: 'var(--chart-3)' },
    vPIS: { label: 'PIS', color: 'var(--chart-5)' },
    vCOFINS: { label: 'COFINS', color: 'var(--chart-2)' },
    // Reforma Tributária (a série de /stats/impostos já traz vIBS/vCBS/vIS).
    vIBS: { label: 'IBS', color: 'var(--chart-4)' },
    vCBS: { label: 'CBS', color: 'var(--chart-6)' },
    vIS: { label: 'IS', color: 'var(--chart-7)' },
} satisfies ChartConfig;

/**
 * Explorador da entidade Impostos (redesign BI / NOTA-125 C): usa TODO o payload
 * de /stats/impostos — carga por tributo (barras), série mensal empilhada (área)
 * e os rankings Top NCM / Top CFOP com drill-through para as NF-e. Antes só as
 * barras de totais eram mostradas (metade da tela vazia).
 */
export function ExplorerImpostos(): JSX.Element {
    const { t } = useTranslation();
    const density = useDensityStore((s) => s.density);
    const { data, isLoading, isError, refetch } = useTaxStats();

    if (isLoading) return <LoadingSkeleton variant="card" />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;
    const totais = data?.totais;
    if (!totais) return <EmptyState mensagem={t('impostos.vazio')} />;

    const linhas = [
        { nome: 'ICMS', valor: totais.vICMS },
        { nome: 'COFINS', valor: totais.vCOFINS },
        { nome: 'IPI', valor: totais.vIPI },
        { nome: t('impostos.icmsSt'), valor: totais.vICMSST },
        { nome: 'PIS', valor: totais.vPIS },
        { nome: t('impostos.fcp'), valor: totais.vFCP },
        // Reforma Tributária — só entram quando houver valor.
        { nome: 'IBS', valor: totais.vIBS },
        { nome: 'CBS', valor: totais.vCBS },
        { nome: 'IS', valor: totais.vIS },
    ].filter((l) => l.valor > 0);
    const total = linhas.reduce((s, l) => s + l.valor, 0);
    const max = Math.max(...linhas.map((l) => l.valor), 1);
    if (linhas.length === 0) return <EmptyState mensagem={t('impostos.vazio')} />;

    const serie = data?.serie ?? [];
    const topNcm = data?.topNcm ?? [];
    const topCfop = data?.topCfop ?? [];
    const transicao = data?.transicao;
    const pctReforma = transicao && transicao.total > 0 ? Math.round((transicao.comReforma / transicao.total) * 100) : 0;

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Transição da Reforma Tributária: % de NF-e já com IBS/CBS (EPIC-25).
                Só aparece quando há alguma nota sob a reforma na base. */}
            {transicao && transicao.comReforma > 0 && (
                <Card className="gap-3 lg:col-span-12">
                    <CardHeader className="space-y-0 pb-0">
                        <h3 className="text-base font-semibold leading-none">{t('impostos.transicaoTitulo')}</h3>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('impostos.transicaoLegenda', { com: transicao.comReforma, total: transicao.total })}
                            </span>
                            <span className="font-mono text-lg font-semibold tabular-nums text-chart-4">{pctReforma}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-chart-4 transition-all" style={{ width: `${pctReforma}%` }} />
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* Carga por tributo (barras) */}
            <Card data-testid="chart" className="gap-4 lg:col-span-5">
                <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
                    <h3 className="text-base font-semibold leading-none">{t('impostos.totalImposto')}</h3>
                    <span className="font-mono text-sm font-medium tabular-nums">{brlK(total)}</span>
                </CardHeader>
                <CardContent className="space-y-1">
                    {linhas.map((l, i) => (
                        <div key={l.nome} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 py-1.5">
                            <span className="text-sm font-medium">{l.nome}</span>
                            <div className="h-2 overflow-hidden rounded bg-muted">
                                <div className="h-full rounded" style={{ width: `${(l.valor / max) * 100}%`, background: chartColor(i) }} />
                            </div>
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">{brlK(l.valor)} · {Math.round((l.valor / total) * 100)}%</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Série mensal empilhada (área) */}
            <Card data-testid="chart" className="gap-4 lg:col-span-7">
                <CardHeader className="space-y-0"><h3 className="text-base font-semibold leading-none">{t('impostos.serieMensal')}</h3></CardHeader>
                <CardContent>
                    {serie.length === 0 ? <EmptyState mensagem={t('impostos.vazio')} /> : (
                        <ChartContainer config={serieConfig} className="h-[220px] w-full">
                            <AreaChart data={serie} margin={{ left: 4, right: 8, top: 8 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="periodo" tickLine={false} axisLine={false} fontSize={11} minTickGap={28} />
                                <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                {(['vICMS', 'vCOFINS', 'vIPI', 'vPIS'] as const).map((k) => (
                                    <Area key={k} dataKey={k} type="monotone" stackId="1" stroke={`var(--color-${k})`} fill={`var(--color-${k})`} fillOpacity={0.25} strokeWidth={2} />
                                ))}
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Top NCM / Top CFOP por imposto — tabelas ordenáveis e paginadas (client).
                self-start: cada card tem a altura do seu conteúdo (o CFOP costuma ter
                menos linhas que o NCM; sem isso o grid os esticava iguais, deixando um
                vazio grande sob o menor). */}
            <div className="self-start lg:col-span-6"><TopNcmTable rows={topNcm} density={density} t={t} /></div>
            <div className="self-start lg:col-span-6"><TopCfopTable rows={topCfop} density={density} t={t} /></div>
        </div>
    );
}

/** Top NCM por imposto — ordenável (NCM/imposto/NF-e) + paginação client. */
function TopNcmTable({ rows, density, t }: { rows: TaxStats['topNcm']; density: Density; t: TFunction }): JSX.Element {
    const { pageRows, toggle, ariaSort, pagination } = useClientTable(rows, {
        ncm: (n) => n.ncm,
        totalImposto: (n) => n.totalImposto,
        totalNFs: (n) => n.totalNFs,
    }, { initialSort: { key: 'totalImposto', direction: 'desc' }, initialPageSize: 10 });
    return (
        <Card data-testid="chart" className="gap-4">
            <CardHeader className="space-y-0"><h3 className="text-base font-semibold leading-none">{t('impostos.topNcm')}</h3></CardHeader>
            <CardContent className="px-0">
                {rows.length === 0 ? <div className="px-6"><EmptyState /></div> : (<>
                    <Table data-testid="data-table" data-zebra className={densityClass(density)}>
                        <TableHeader><TableRow>
                            <SortableHead sortKey="ncm" ariaSort={ariaSort} onToggle={toggle} className="pl-6">{t('nf.ncm')}</SortableHead>
                            <SortableHead sortKey="totalImposto" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('impostos.totalImposto')}</SortableHead>
                            <SortableHead sortKey="totalNFs" ariaSort={ariaSort} onToggle={toggle} align="right" className="pr-6 text-right">NF-e</SortableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {pageRows.map((n) => (
                                <TableRow key={n.ncm}>
                                    <TableCell className="max-w-0 pl-6">
                                        <div className="flex items-baseline gap-2">
                                            <Link className="font-mono text-xs text-primary hover:underline shrink-0" to={'/explore' as string} search={{ entity: 'notas', ncm: n.ncm } as never}>{n.ncm}</Link>
                                            {n.descricao && <span className="truncate text-xs text-muted-foreground" title={n.descricao}>{n.descricao}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{brlK(n.totalImposto)}</TableCell>
                                    <TableCell className="pr-6 text-right font-mono tabular-nums text-muted-foreground">{n.totalNFs}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination {...pagination} />
                </>)}
            </CardContent>
        </Card>
    );
}

/** Top CFOP por imposto — ordenável (CFOP/ICMS/IPI/NF-e) + paginação client. */
function TopCfopTable({ rows, density, t }: { rows: TaxStats['topCfop']; density: Density; t: TFunction }): JSX.Element {
    const { pageRows, toggle, ariaSort, pagination } = useClientTable(rows, {
        cfop: (c) => c.cfop,
        vICMS: (c) => c.vICMS,
        vIPI: (c) => c.vIPI,
        totalNFs: (c) => c.totalNFs,
    }, { initialSort: { key: 'vICMS', direction: 'desc' }, initialPageSize: 10 });
    return (
        <Card data-testid="chart" className="gap-4">
            <CardHeader className="space-y-0"><h3 className="text-base font-semibold leading-none">{t('impostos.topCfop')}</h3></CardHeader>
            <CardContent className="px-0">
                {rows.length === 0 ? <div className="px-6"><EmptyState /></div> : (<>
                    <Table data-testid="data-table" data-zebra className={densityClass(density)}>
                        <TableHeader><TableRow>
                            <SortableHead sortKey="cfop" ariaSort={ariaSort} onToggle={toggle} className="pl-6">CFOP</SortableHead>
                            <SortableHead sortKey="vICMS" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">ICMS</SortableHead>
                            <SortableHead sortKey="vIPI" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">IPI</SortableHead>
                            <SortableHead sortKey="totalNFs" ariaSort={ariaSort} onToggle={toggle} align="right" className="pr-6 text-right">NF-e</SortableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {pageRows.map((c) => (
                                <TableRow key={c.cfop}>
                                    <TableCell className="max-w-0 pl-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-mono text-xs shrink-0">{c.cfop}</span>
                                            {c.descricao && <span className="truncate text-xs text-muted-foreground" title={c.descricao}>{c.descricao}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{brlK(c.vICMS)}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{brlK(c.vIPI)}</TableCell>
                                    <TableCell className="pr-6 text-right font-mono tabular-nums text-muted-foreground">{c.totalNFs}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination {...pagination} />
                </>)}
            </CardContent>
        </Card>
    );
}
