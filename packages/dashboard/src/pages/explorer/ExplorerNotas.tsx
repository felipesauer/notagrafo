import { type JSX, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNFList, type NFListItem } from '../../api/hooks.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { NFRowActions } from '../../components/NFRowActions.js';
import { SortableHead } from '../../components/SortableHead.js';
import { TablePagination } from '../../components/TablePagination.js';
import { ariaSortFor, type SortState } from '../../hooks/useTableSort.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { useDensityStore, densityClass } from '../../stores/density.store.js';
import { Card } from '../../components/ui/card.js';
import { NFPeek } from './NFPeek.js';

/** Colunas que o /nf aceita ordenar (ORDERABLE no backend). */
type NfSortKey = 'numero' | 'valorTotal' | 'dataEmissao';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;


/** Parte (emitente/destinatário): razão social + CNPJ pequeno mono. */
function Parte({ p }: { p?: { cnpj: string; razaoSocial: string; uf: string } }): JSX.Element {
    if (!p) return <span className="text-muted-foreground">—</span>;
    return (
        <div className="flex flex-col leading-tight">
            <span className="truncate font-medium">{p.razaoSocial || '—'}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{cnpjFmt(p.cnpj)}{p.uf ? ` · ${p.uf}` : ''}</span>
        </div>
    );
}

/**
 * Explorador da entidade Notas fiscais: tabela densa (mono nos dados fiscais)
 * onde clicar numa linha abre o Peek lateral, navegável por ↑/↓ sem perder o
 * lugar. Peek é o drill-down primário; Enter/botão leva ao detalhe completo.
 */
export function ExplorerNotas({ q, status, recorte, peek, onPeek }: { q?: string; status?: string; recorte?: Record<string, string | boolean>; peek?: string; onPeek: (chave: string | undefined) => void }): JSX.Element {
    const { t } = useTranslation();
    const density = useDensityStore((s) => s.density);
    // Ordenação e paginação SERVER-SIDE (ADR-16): orderBy/order via query; a
    // paginação é por cursor keyset (não permite salto p/ página N, só Ant/Próx).
    const [sort, setSort] = useState<SortState<NfSortKey>>({ key: 'dataEmissao', direction: 'desc' });
    const [pageSize, setPageSize] = useState(50);
    const [cursorStack, setCursorStack] = useState<string[]>([]); // cursores das páginas anteriores
    const cursor = cursorStack[cursorStack.length - 1];
    // Filtros/ordenação mudaram → volta para a 1ª página (zera a pilha de cursores).
    const filtrosKey = JSON.stringify({ q, status, recorte, sort, pageSize });
    useEffect(() => { setCursorStack([]); }, [filtrosKey]);

    const query = useNFList({
        limit: pageSize,
        orderBy: sort.key ?? 'dataEmissao',
        order: sort.direction,
        ...(cursor ? { cursor } : {}),
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...recorte,
    });
    const rows = query.data?.data ?? [];
    const nextCursor = query.data?.pagination?.nextCursor ?? null;

    const ariaSort = (key: NfSortKey) => ariaSortFor(sort, key);
    const toggleSort = (key: NfSortKey): void => {
        setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' }));
    };

    if (query.isLoading) return <LoadingSkeleton variant="table" linhas={10} colunas={6} />;
    if (query.isError) return <InlineError onRetry={() => void query.refetch()} />;
    if (rows.length === 0) return <EmptyState />;

    // seleção derivada da URL (peek = chave) → o peek é linkável e o voltar funciona
    const sel = peek ? rows.findIndex((r) => r.chaveAcesso === peek) : -1;
    const selNf: NFListItem | null = sel >= 0 ? (rows[sel] ?? null) : null;
    const goTo = (i: number): void => { const r = rows[i]; if (r) onPeek(r.chaveAcesso); };

    return (
        <>
            {/* Desktop: tabela densa (sticky header; densidade via store). O scroll
                vertical + max-height vivem no container interno do <Table> via CSS
                [data-slot=table-container]:has(> [data-sticky]) — ver globals.css. */}
            <div className="hidden h-full md:block">
                <Table data-testid="data-table" data-sticky data-zebra className={densityClass(density)}>
                    <TableHeader>
                        <TableRow>
                            <SortableHead sortKey="numero" ariaSort={ariaSort} onToggle={toggleSort} className="w-16">{t('nf.numero')}</SortableHead>
                            <TableHead className="w-28">{t('nf.chave')}</TableHead>
                            <TableHead>{t('nf.emitente')}</TableHead>
                            <TableHead>{t('nf.destinatario')}</TableHead>
                            <SortableHead sortKey="valorTotal" ariaSort={ariaSort} onToggle={toggleSort} align="right" className="w-32 text-right">{t('nf.valor')}</SortableHead>
                            <TableHead className="w-28">{t('nf.status')}</TableHead>
                            <SortableHead sortKey="dataEmissao" ariaSort={ariaSort} onToggle={toggleSort} className="w-44">{t('nf.emissao')}</SortableHead>
                            <TableHead className="w-[116px] text-right">{t('nf.acoes')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((nf, i) => (
                            <TableRow
                                key={nf.chaveAcesso}
                                data-i={i}
                                className={`cursor-pointer ${sel === i ? 'bg-primary/10 shadow-[inset_2px_0_0_var(--primary)]' : ''}`}
                                onClick={() => onPeek(nf.chaveAcesso)}
                            >
                                <TableCell className="font-mono font-medium tabular-nums">{nf.numero}</TableCell>
                                <TableCell className="font-mono text-[11px] text-muted-foreground">…{nf.chaveAcesso.slice(-8)}</TableCell>
                                <TableCell><Parte p={nf.emitente} /></TableCell>
                                <TableCell><Parte p={nf.destinatario} /></TableCell>
                                <TableCell className="text-right font-mono font-medium tabular-nums"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                <TableCell><NFStatusBadge status={nf.status} /></TableCell>
                                <TableCell className="font-mono text-muted-foreground tabular-nums"><DateDisplay value={nf.dataEmissao} /></TableCell>
                                <TableCell><NFRowActions chave={nf.chaveAcesso} cnpjEmitente={nf.emitente?.cnpj} onView={() => onPeek(nf.chaveAcesso)} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    page={cursorStack.length}
                    pageSize={pageSize}
                    hasPrev={cursorStack.length > 0}
                    hasNext={!!nextCursor}
                    onPrev={() => setCursorStack((s) => s.slice(0, -1))}
                    onNext={() => nextCursor && setCursorStack((s) => [...s, nextCursor])}
                    onPageSize={setPageSize}
                />
            </div>

            {/* Mobile: cards empilhados (sem scroll lateral) */}
            <div className="grid gap-2.5 p-3 md:hidden" data-testid="data-cards">
                {rows.map((nf, i) => (
                    <Card key={nf.chaveAcesso} className={`cursor-pointer gap-0 p-3.5 ${sel === i ? 'ring-2 ring-primary' : ''}`} onClick={() => onPeek(nf.chaveAcesso)}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <span className="text-xs text-muted-foreground">{t('nf.numero')}</span>
                                <p className="font-mono font-semibold leading-tight tabular-nums text-primary">{nf.numero}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-medium tabular-nums"><CurrencyValue value={nf.valorTotal} /></span>
                                <div className="mt-1"><NFStatusBadge status={nf.status} /></div>
                            </div>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-baseline gap-2"><span className="w-16 shrink-0 text-xs text-muted-foreground">{t('nf.emitente')}</span><Parte p={nf.emitente} /></div>
                            <div className="flex items-baseline gap-2"><span className="w-16 shrink-0 text-xs text-muted-foreground">{t('nf.destinatario')}</span><Parte p={nf.destinatario} /></div>
                        </div>
                        <div className="mt-3 border-t pt-2.5 text-xs text-muted-foreground tabular-nums"><DateDisplay value={nf.dataEmissao} /></div>
                    </Card>
                ))}
            </div>

            <NFPeek
                nf={selNf}
                open={sel >= 0}
                onOpenChange={(o) => !o && onPeek(undefined)}
                onPrev={() => sel > 0 && goTo(sel - 1)}
                onNext={() => sel >= 0 && sel < rows.length - 1 && goTo(sel + 1)}
                hasPrev={sel > 0}
                hasNext={sel >= 0 && sel < rows.length - 1}
            />
        </>
    );
}
