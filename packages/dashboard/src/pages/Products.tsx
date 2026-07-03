import { type JSX, Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTopProducts, usePriceHistory } from '../api/hooks.js';
import { CurrencyValue, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { SortableHead } from '../components/SortableHead.js';
import { ChartCard } from '../components/charts/ChartCard.js';
import { ChartTooltip } from '../components/charts/ChartTooltip.js';
import { useTableSort } from '../hooks/useTableSort.js';
import { Card } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Button } from '../components/ui/button.js';

const brl = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Gráfico de evolução do preço médio de um produto por mês (NOTA-46). */
function PriceHistoryChart({ idUnico }: { idUnico: string }): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError } = usePriceHistory(idUnico);
    if (isLoading) return <LoadingSkeleton variant="card" />;
    if (isError) return <p className="text-sm text-destructive">{t('comum.erro')}</p>;
    const serie = data?.historico ?? [];
    if (serie.length === 0) return <p className="text-sm text-muted-foreground">{t('produtos.semHistorico')}</p>;
    return (
        <ChartCard title={t('produtos.historicoPreco')} height={200}>
            <LineChart data={serie}>
                <XAxis dataKey="periodo" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatValue={(v) => brl(Number(v))} />} />
                <Line dataKey="precoMedio" stroke="var(--chart-1)" strokeWidth={2} dot={false} name={t('produtos.precoMedio')} />
            </LineChart>
        </ChartCard>
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

export function ProductsPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTopProducts();
    const [expandido, setExpandido] = useState<string | null>(null);

    const ranking = (data?.ranking as unknown as Produto[]) ?? [];
    const { sorted, toggle, ariaSort } = useTableSort(ranking, {
        descricao: (p) => p.descricao ?? '',
        ncm: (p) => p.ncm ?? '',
        totalNFs: (p) => p.totalNFs ?? 0,
        valorTotal: (p) => p.valorTotal ?? 0,
    });

    if (isLoading) return <div><PageHeader title={t('produtos.titulo')} /><LoadingSkeleton variant="table" linhas={6} colunas={4} /></div>;
    if (isError || !data) return <div><PageHeader title={t('produtos.titulo')} /><InlineError onRetry={() => void refetch()} /></div>;
    if (ranking.length === 0) return <div><PageHeader title={t('produtos.titulo')} /><EmptyState /></div>;

    return (
        <div>
            <PageHeader title={t('produtos.titulo')} />
            <Card className="overflow-hidden py-0">
                <div className="overflow-x-auto">
                <Table data-testid="data-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8" />
                            <SortableHead ariaSort={ariaSort('descricao')} onToggle={() => toggle('descricao')}>{t('produtos.descricao')}</SortableHead>
                            <SortableHead ariaSort={ariaSort('ncm')} onToggle={() => toggle('ncm')}>{t('produtos.ncm')}</SortableHead>
                            <SortableHead ariaSort={ariaSort('totalNFs')} onToggle={() => toggle('totalNFs')} align="right">{t('produtos.totalNFs')}</SortableHead>
                            <SortableHead ariaSort={ariaSort('valorTotal')} onToggle={() => toggle('valorTotal')} align="right">{t('produtos.valorTotal')}</SortableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((p) => {
                            const aberto = expandido === p.idUnico;
                            return (
                                <Fragment key={p.idUnico}>
                                    <TableRow className="cursor-pointer" onClick={() => setExpandido(aberto ? null : p.idUnico)}>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-expanded={aberto}
                                                aria-label={aberto ? t('comum.fechar') : t('produtos.historicoPreco')}
                                                onClick={(ev) => { ev.stopPropagation(); setExpandido(aberto ? null : p.idUnico); }}
                                            >
                                                {aberto ? <ChevronDown /> : <ChevronRight />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{p.descricao ?? '—'}</TableCell>
                                        <TableCell className="tabular-nums">{p.ncm ?? '—'}</TableCell>
                                        <TableCell className="text-right tabular-nums">{p.totalNFs ?? 0}</TableCell>
                                        <TableCell className="text-right"><CurrencyValue value={p.valorTotal ?? 0} /></TableCell>
                                    </TableRow>
                                    {aberto && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="p-4">
                                                <div data-testid="inline-card" className="mb-4 flex flex-wrap gap-6 text-sm">
                                                    <span><span className="text-muted-foreground">{t('produtos.quantidade')}:</span> <strong className="tabular-nums">{p.quantidadeTotal ?? 0}</strong></span>
                                                    <span><span className="text-muted-foreground">{t('produtos.precoMedio')}:</span> <strong><CurrencyValue value={p.precoMedio ?? 0} /></strong></span>
                                                </div>
                                                <PriceHistoryChart idUnico={p.idUnico} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
                </div>
            </Card>
        </div>
    );
}
