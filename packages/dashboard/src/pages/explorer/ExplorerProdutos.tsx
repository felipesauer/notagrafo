import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { useTopProducts } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { Card } from '../../components/ui/card.js';

interface Produto { idUnico: string; descricao?: string; ncm?: string; totalNFs?: number; valorTotal?: number }
const brlK = (n: number): string => (n >= 1000 ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${n.toFixed(2)}`);

/** Explorador da entidade Produtos: ranking por volume, com deep-link para as NF-e do NCM. */
export function ExplorerProdutos(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTopProducts();
    const rows = (data?.ranking as unknown as Produto[]) ?? [];

    if (isLoading) return <LoadingSkeleton variant="table" linhas={8} colunas={4} />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;
    if (rows.length === 0) return <EmptyState />;

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <Table data-testid="data-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('produtos.descricao')}</TableHead>
                            <TableHead>{t('produtos.ncm')}</TableHead>
                            <TableHead className="text-right">{t('produtos.totalNFs')}</TableHead>
                            <TableHead className="text-right">{t('overview.valorTotal')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((p) => (
                            <TableRow key={p.idUnico} className="cursor-pointer" onClick={() => { /* deep-link via Link no NCM */ }}>
                                <TableCell className="font-medium">{p.descricao || '—'}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    {p.ncm ? <Link className="font-mono text-[12px] text-primary hover:underline" to={'/explorar' as string} search={{ entity: 'notas', ncm: p.ncm } as never}>{p.ncm}</Link> : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{p.totalNFs ?? 0}</TableCell>
                                <TableCell className="text-right font-mono font-medium tabular-nums">{brlK(p.valorTotal ?? 0)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="grid gap-2.5 p-3 md:hidden">
                {rows.map((p) => (
                    <Card key={p.idUnico} className="gap-0 p-3.5">
                        <p className="font-medium leading-tight">{p.descricao || '—'}</p>
                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
                            {p.ncm ? <Link className="font-mono text-primary" to={'/explorar' as string} search={{ entity: 'notas', ncm: p.ncm } as never}>NCM {p.ncm}</Link> : <span className="text-muted-foreground">—</span>}
                            <span className="font-mono font-medium tabular-nums">{brlK(p.valorTotal ?? 0)} · {p.totalNFs ?? 0} NF-e</span>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
