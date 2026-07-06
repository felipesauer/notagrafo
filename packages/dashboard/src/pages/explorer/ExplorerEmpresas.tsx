import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Network, X } from 'lucide-react';
import { useTopCompanies, useCompany, type TopEmpresa } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { SortableHead } from '../../components/SortableHead.js';
import { TablePagination } from '../../components/TablePagination.js';
import { useClientTable } from '../../hooks/useClientTable.js';
import { Card } from '../../components/ui/card.js';
import { Sheet, SheetContent } from '../../components/ui/sheet.js';
import { Button } from '../../components/ui/button.js';
import { useDensityStore, densityClass } from '../../stores/density.store.js';

const brlK = (n: number): string => (n >= 1000 ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${n.toFixed(2)}`);
const cnpjFmt = (c: string): string => (c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c);

/** Peek de empresa: stats (emitidas/recebidas) + atalhos para NF-e e rede. */
function EmpresaPeek({ cnpj, empresa, onClose, onOpenChange }: { cnpj: string | undefined; empresa?: TopEmpresa; onClose: () => void; onOpenChange: (o: boolean) => void }): JSX.Element {
    const { t } = useTranslation();
    const { data } = useCompany(cnpj ?? '');
    const stats = (data as { stats?: { totalNFsEmitidas?: number; totalNFsRecebidas?: number } } | undefined)?.stats;

    return (
        <Sheet open={!!cnpj} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-[420px] max-w-[92vw] flex-col gap-0 p-0" data-testid="empresa-peek">
                {empresa && (
                    <>
                        <div className="flex items-center gap-2 border-b px-4 py-3">
                            <span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{empresa.uf}</span>
                            <span className="text-xs text-muted-foreground">{t('empresas.titulo')}</span>
                            <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label={t('comum.fechar')}><X /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <h2 className="text-lg font-semibold leading-tight tracking-tight">{empresa.razaoSocial}</h2>
                            <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">{cnpjFmt(empresa.cnpj)}</p>
                            <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-[13px]">
                                <dt className="text-muted-foreground">{t('empresas.nfsEmitidas')}</dt><dd className="font-mono tabular-nums">{stats?.totalNFsEmitidas ?? empresa.totalNFs}</dd>
                                <dt className="text-muted-foreground">{t('empresas.nfsRecebidas')}</dt><dd className="font-mono tabular-nums">{stats?.totalNFsRecebidas ?? '—'}</dd>
                                <dt className="text-muted-foreground">{t('overview.valorTotal')}</dt><dd className="font-mono font-medium tabular-nums">{brlK(empresa.valorTotal)}</dd>
                            </dl>
                        </div>
                        <div className="flex gap-2 border-t p-3">
                            <Button asChild type="button" variant="outline" size="sm" className="flex-1 justify-center">
                                <Link to={'/explorar' as string} search={{ entity: 'notas', cnpjEmitente: empresa.cnpj } as never}>{t('empresas.verNFs', { defaultValue: 'Ver NF-e' })}</Link>
                            </Button>
                            <Button asChild type="button" size="sm" className="flex-1 justify-center">
                                <Link to={'/grafo' as string} search={{ cnpj: empresa.cnpj } as never}><Network /> {t('empresas.verGrafo')}</Link>
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

/** Explorador da entidade Empresas: ranking por volume, com peek de parceiros. */
export function ExplorerEmpresas({ peek, onPeek, busca }: { peek?: string; onPeek: (cnpj: string | undefined) => void; busca?: string }): JSX.Element {
    const { t } = useTranslation();
    const density = useDensityStore((s) => s.density);
    const { data, isLoading, isError, refetch } = useTopCompanies();
    const todas = data?.ranking ?? [];
    // Busca client-side: razão social ou dígitos do CNPJ.
    const termo = (busca ?? '').trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    const rows = termo
        ? todas.filter((e) => e.razaoSocial.toLowerCase().includes(termo) || (digitos && e.cnpj.includes(digitos)))
        : todas;
    // ordenação + paginação client-side (dados já carregados) — ADR-16. DEVE vir
    // antes de qualquer early-return (regras de hooks); opera sobre [] enquanto carrega.
    const { pageRows, toggle, ariaSort, pagination } = useClientTable(rows, {
        posicao: (r) => r.posicao,
        razaoSocial: (r) => r.razaoSocial,
        uf: (r) => r.uf,
        totalNFs: (r) => r.totalNFs,
        valorTotal: (r) => r.valorTotal,
    }, { initialSort: { key: 'valorTotal', direction: 'desc' } });

    if (isLoading) return <LoadingSkeleton variant="table" linhas={8} colunas={5} />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;
    if (todas.length === 0) return <EmptyState />;
    if (rows.length === 0) return <EmptyState mensagem={t('explorer.semResultados')} />;

    const sel = peek ? rows.find((r) => r.cnpj === peek) : undefined;
    // maior valor faturado → escala a barra de proporção (ranking visual denso).
    const maxValor = Math.max(...rows.map((r) => r.valorTotal), 1);

    return (
        <>
            <div className="hidden h-full md:block">
                <Table data-testid="data-table" data-sticky data-zebra className={densityClass(density)}>
                    <TableHeader>
                        <TableRow>
                            <SortableHead sortKey="posicao" ariaSort={ariaSort} onToggle={toggle} align="right" className="w-10 text-right">#</SortableHead>
                            <SortableHead sortKey="razaoSocial" ariaSort={ariaSort} onToggle={toggle}>{t('empresas.razaoSocial')}</SortableHead>
                            <TableHead>{t('empresas.cnpj')}</TableHead>
                            <SortableHead sortKey="uf" ariaSort={ariaSort} onToggle={toggle}>{t('empresas.uf')}</SortableHead>
                            <SortableHead sortKey="totalNFs" ariaSort={ariaSort} onToggle={toggle} align="right" className="w-24 text-right">{t('empresas.nfsEmitidas')}</SortableHead>
                            <SortableHead sortKey="valorTotal" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('overview.valorTotal')}</SortableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.map((e) => (
                            <TableRow key={e.cnpj} className={`cursor-pointer ${sel?.cnpj === e.cnpj ? 'bg-primary/10 shadow-[inset_2px_0_0_var(--primary)]' : ''}`} onClick={() => onPeek(e.cnpj)}>
                                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{e.posicao}</TableCell>
                                <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                                <TableCell className="font-mono text-[11px] text-muted-foreground">{cnpjFmt(e.cnpj)}</TableCell>
                                <TableCell><span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{e.uf}</span></TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{e.totalNFs}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted lg:block">
                                            <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${Math.max((e.valorTotal / maxValor) * 100, 3)}%` }} />
                                        </div>
                                        <span className="w-24 text-right font-mono font-medium tabular-nums">{brlK(e.valorTotal)}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination {...pagination} />
            </div>

            <div className="grid gap-2.5 p-3 md:hidden">
                {pageRows.map((e) => (
                    <Card key={e.cnpj} className="cursor-pointer gap-0 p-3.5" onClick={() => onPeek(e.cnpj)}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 font-medium leading-tight">{e.razaoSocial}</p>
                            <span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{e.uf}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{cnpjFmt(e.cnpj)}</p>
                        <div className="mt-2 flex justify-between border-t pt-2 text-xs">
                            <span className="text-muted-foreground">{e.totalNFs} NF-e</span>
                            <span className="font-mono font-medium tabular-nums">{brlK(e.valorTotal)}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <EmpresaPeek cnpj={peek} empresa={sel} onClose={() => onPeek(undefined)} onOpenChange={(o) => !o && onPeek(undefined)} />
        </>
    );
}
