import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { useTopProducts, usePriceHistory, useProductCompanies } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { Card } from '../../components/ui/card.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet.js';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../../components/ui/chart.js';
import { useDensityStore, densityClass } from '../../stores/density.store.js';

interface Produto { idUnico: string; descricao?: string; ncm?: string; totalNFs?: number; valorTotal?: number }
const brlK = (n: number): string => (n >= 1000 ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${n.toFixed(2)}`);
const cnpjFmt = (c: string): string => (c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c);

/**
 * O idUnico é `EAN` ou `codigo::cnpjEmitente` (produtos sem EAN). Extrai as partes
 * para DIFERENCIAR linhas com a mesma descrição/NCM (ex.: 'Notebook 15 polegadas'
 * de 5 emitentes eram idênticas na tabela — pareciam duplicatas).
 */
function parseIdUnico(id: string): { codigo: string; cnpj?: string } {
    const i = id.indexOf('::');
    return i === -1 ? { codigo: id } : { codigo: id.slice(0, i), cnpj: id.slice(i + 2) };
}

const precoConfig = { precoMedio: { label: 'Preço médio', color: 'var(--chart-3)' } } satisfies ChartConfig;

/**
 * Explorador da entidade Produtos: ranking por volume, deep-link por NCM e — ao
 * clicar na linha — um Peek lateral com o histórico de preço (usePriceHistory) e
 * as empresas ligadas (useProductCompanies). Aproveita endpoints que existiam mas
 * não tinham tela (NOTA-125 polish).
 */
export function ExplorerProdutos({ peek, onPeek, busca }: { peek?: string; onPeek: (id: string | undefined) => void; busca?: string }): JSX.Element {
    const { t } = useTranslation();
    const density = useDensityStore((s) => s.density);
    const { data, isLoading, isError, refetch } = useTopProducts();
    const todos = (data?.ranking as unknown as Produto[]) ?? [];
    // Busca client-side: descrição ou NCM.
    const termo = (busca ?? '').trim().toLowerCase();
    const rows = termo
        ? todos.filter((p) => (p.descricao ?? '').toLowerCase().includes(termo) || (p.ncm ?? '').includes(termo))
        : todos;

    if (isLoading) return <LoadingSkeleton variant="table" linhas={8} colunas={4} />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;
    if (todos.length === 0) return <EmptyState />;
    if (rows.length === 0) return <EmptyState mensagem={t('explorer.semResultados')} />;

    const sel = peek ? rows.find((p) => p.idUnico === peek) : undefined;

    return (
        <>
            <div className="hidden h-full md:block">
                <Table data-testid="data-table" data-sticky className={densityClass(density)}>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('produtos.descricao')}</TableHead>
                            <TableHead className="w-40">{t('produtos.codigo')}</TableHead>
                            <TableHead className="w-28">{t('produtos.ncm')}</TableHead>
                            <TableHead className="w-20 text-right">{t('produtos.totalNFs')}</TableHead>
                            <TableHead className="w-32 text-right">{t('overview.valorTotal')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((p) => {
                            const { codigo, cnpj } = parseIdUnico(p.idUnico);
                            return (
                            <TableRow
                                key={p.idUnico}
                                className={`cursor-pointer ${sel?.idUnico === p.idUnico ? 'bg-primary/10 shadow-[inset_2px_0_0_var(--primary)]' : ''}`}
                                onClick={() => onPeek(p.idUnico)}
                            >
                                <TableCell className="font-medium">{p.descricao || '—'}</TableCell>
                                <TableCell className="font-mono text-[11px] text-muted-foreground">
                                    {codigo}{cnpj && <span className="block text-muted-foreground/70">{cnpjFmt(cnpj)}</span>}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    {p.ncm ? <Link className="font-mono text-[12px] text-primary hover:underline" to={'/explorar' as string} search={{ entity: 'notas', ncm: p.ncm } as never}>{p.ncm}</Link> : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{p.totalNFs ?? 0}</TableCell>
                                <TableCell className="text-right font-mono font-medium tabular-nums">{brlK(p.valorTotal ?? 0)}</TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="grid gap-2.5 p-3 md:hidden" data-testid="data-cards">
                {rows.map((p) => (
                    <Card key={p.idUnico} className="cursor-pointer gap-0 p-3.5" onClick={() => onPeek(p.idUnico)}>
                        <p className="font-medium leading-tight">{p.descricao || '—'}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{parseIdUnico(p.idUnico).codigo}{parseIdUnico(p.idUnico).cnpj ? ` · ${cnpjFmt(parseIdUnico(p.idUnico).cnpj!)}` : ''}</p>
                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
                            {p.ncm ? <Link className="font-mono text-primary" to={'/explorar' as string} search={{ entity: 'notas', ncm: p.ncm } as never} onClick={(e) => e.stopPropagation()}>NCM {p.ncm}</Link> : <span className="text-muted-foreground">—</span>}
                            <span className="font-mono font-medium tabular-nums">{brlK(p.valorTotal ?? 0)} · {p.totalNFs ?? 0} NF-e</span>
                        </div>
                    </Card>
                ))}
            </div>

            <ProdutoPeek produto={sel} onClose={() => onPeek(undefined)} />
        </>
    );
}

/** Peek lateral do produto: histórico de preço (área) + empresas ligadas. */
function ProdutoPeek({ produto, onClose }: { produto?: Produto; onClose: () => void }): JSX.Element {
    const { t } = useTranslation();
    const id = produto?.idUnico ?? '';
    const historico = usePriceHistory(id).data?.historico ?? [];
    const empresas = useProductCompanies(id).data?.empresas ?? [];

    return (
        <Sheet open={!!produto} onOpenChange={(o) => !o && onClose()}>
            <SheetContent side="right" className="flex w-[440px] max-w-[92vw] flex-col gap-0 p-0" data-testid="produto-peek">
                {produto && (
                    <>
                        <SheetHeader className="border-b px-4 py-3">
                            <SheetTitle className="truncate text-base" title={produto.descricao}>{produto.descricao || produto.idUnico}</SheetTitle>
                            <p className="font-mono text-[11px] text-muted-foreground">{produto.ncm ? `NCM ${produto.ncm} · ` : ''}{brlK(produto.valorTotal ?? 0)} · {produto.totalNFs ?? 0} NF-e</p>
                        </SheetHeader>
                        <div className="flex flex-col gap-5 overflow-y-auto p-4">
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('produtos.historicoPreco')}</p>
                                {historico.length === 0 ? <EmptyState /> : (
                                    <ChartContainer config={precoConfig} className="h-[150px] w-full">
                                        <AreaChart data={historico} margin={{ left: 4, right: 8, top: 8 }}>
                                            <defs>
                                                <linearGradient id="prod-preco" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--color-precoMedio)" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="var(--color-precoMedio)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="periodo" tickLine={false} axisLine={false} fontSize={10} minTickGap={24} />
                                            <YAxis tickLine={false} axisLine={false} fontSize={10} width={40} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                                            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                            <Area dataKey="precoMedio" type="monotone" stroke="var(--color-precoMedio)" fill="url(#prod-preco)" strokeWidth={2} />
                                        </AreaChart>
                                    </ChartContainer>
                                )}
                            </div>
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('produtos.empresasLigadas')}</p>
                                {empresas.length === 0 ? <EmptyState /> : (
                                    <ul className="space-y-1.5">
                                        {empresas.slice(0, 10).map((e) => (
                                            <li key={`${e.cnpj}-${e.papel}`} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${e.papel === 'emitente' ? 'bg-chart-1/10 text-chart-1' : 'bg-chart-2/10 text-chart-2'}`}>
                                                    {t(e.papel === 'emitente' ? 'nf.emitente' : 'nf.destinatario')}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">{e.razaoSocial}</p>
                                                    <p className="font-mono text-[10px] text-muted-foreground">{cnpjFmt(e.cnpj)}</p>
                                                </div>
                                                <span className="font-mono tabular-nums text-muted-foreground">{brlK(e.valor)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
