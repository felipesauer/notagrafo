import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Copy, Download, Eye, MoreHorizontal, Upload, Waypoints } from 'lucide-react';
import { useNFList, type NFListItem } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { NFStatusBadge, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { UploadModal } from '../components/UploadModal.js';
import { NFFilterBar } from '../components/NFFilterBar.js';
import { type NFFiltros } from '../components/filtros.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip.js';

/** Colunas ordenáveis server-side (batem com ORDERABLE do listInvoices). */
type OrderBy = 'numero' | 'valorTotal' | 'dataEmissao';
type Order = 'asc' | 'desc';

/** Cabeçalho de coluna com ordenação server-side (orderBy/order → query). */
function SortHead({ col, label, orderBy, order, onSort, align }: {
    col: OrderBy; label: string; orderBy: OrderBy; order: Order; onSort: (c: OrderBy) => void; align?: 'right';
}): JSX.Element {
    const active = orderBy === col;
    const Icon = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
        <TableHead aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'} className={align === 'right' ? 'text-right' : undefined}>
            <button type="button" onClick={() => onSort(col)} className={`inline-flex items-center gap-1 font-medium hover:text-foreground ${active ? 'text-foreground' : 'text-muted-foreground'} ${align === 'right' ? 'flex-row-reverse' : ''}`}>
                {label}<Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

/** Célula de parte (emitente/destinatário): razão social + CNPJ pequeno mono. */
function Parte({ p }: { p?: { cnpj: string; razaoSocial: string; uf: string } }): JSX.Element {
    if (!p) return <span className="text-muted-foreground">—</span>;
    const cnpj = p.cnpj.length === 14 ? p.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : p.cnpj;
    return (
        <div className="flex flex-col leading-tight">
            <span className="font-medium">{p.razaoSocial || '—'}</span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{cnpj}{p.uf ? ` · ${p.uf}` : ''}</span>
        </div>
    );
}

/** Página de listagem de NFs: barra de filtros no topo + tabela em largura total. */
export function NFListPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { cnpjEmitente?: string; ncm?: string; comImposto?: boolean; status?: string };
    const [status, setStatus] = useState(search.status ?? '');
    const [qInput, setQInput] = useState('');
    const q = useDebouncedValue(qInput, 300);
    const [filtros, setFiltros] = useState<NFFiltros>(() => ({
        ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
        ...(search.ncm ? { ncm: search.ncm } : {}),
        ...(search.comImposto ? { comImposto: true } : {}),
    }));
    const [orderBy, setOrderBy] = useState<OrderBy>('dataEmissao');
    const [order, setOrder] = useState<Order>('desc');
    const [cursores, setCursores] = useState<string[]>([]);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        setFiltros({
            ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
            ...(search.ncm ? { ncm: search.ncm } : {}),
            ...(search.comImposto ? { comImposto: true } : {}),
        });
        setStatus(search.status ?? '');
        setCursores([]);
    }, [search.cnpjEmitente, search.ncm, search.comImposto, search.status]);

    useEffect(() => {
        setCursores([]);
    }, [q, status, orderBy, order]);

    const cursorAtual = cursores[cursores.length - 1];
    const query = useNFList({
        limit: 20,
        orderBy,
        order,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
        ...filtros,
        ...(cursorAtual ? { cursor: cursorAtual } : {}),
    });

    function aplicarFiltros(novos: NFFiltros): void {
        setCursores([]);
        setFiltros(novos);
    }
    function onSort(col: OrderBy): void {
        if (orderBy === col) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        else { setOrderBy(col); setOrder('desc'); }
    }
    function filtrarPorEmitente(cnpj: string): void {
        aplicarFiltros({ ...filtros, cnpjEmitente: cnpj });
    }

    const page = cursores.length + 1;
    const shown = query.data?.data.length ?? 0;
    const total = query.data?.meta?.total;

    return (
        <div>
            <PageHeader
                title={t('sidebar.nfs')}
                actions={<Button type="button" onClick={() => setModalAberto(true)}><Upload /> {t('nf.uploadTitulo')}</Button>}
            />

            <div className="space-y-4">
                <NFFilterBar q={qInput} onQ={setQInput} status={status} onStatus={setStatus} filtros={filtros} onFiltros={aplicarFiltros} shown={shown} total={total} />

                {query.isLoading && <LoadingSkeleton variant="table" linhas={8} colunas={7} />}
                {query.isError && <InlineError onRetry={() => void query.refetch()} />}
                {query.data && query.data.data.length === 0 && <EmptyState />}

                {query.data && query.data.data.length > 0 && (
                    <>
                        {/* Desktop: tabela densa (md+) */}
                        <Card className="hidden overflow-hidden py-0 md:block">
                            <div className="overflow-x-auto">
                                <Table data-testid="data-table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('nf.chave')}</TableHead>
                                            <SortHead col="numero" label={t('nf.numero')} orderBy={orderBy} order={order} onSort={onSort} />
                                            <TableHead>{t('nf.emitente')}</TableHead>
                                            <TableHead>{t('nf.destinatario')}</TableHead>
                                            <SortHead col="valorTotal" label={t('nf.valor')} orderBy={orderBy} order={order} onSort={onSort} align="right" />
                                            <TableHead>{t('nf.status')}</TableHead>
                                            <SortHead col="dataEmissao" label={t('nf.emissao')} orderBy={orderBy} order={order} onSort={onSort} />
                                            <TableHead className="w-[132px] text-right">{t('nf.acoes')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {query.data.data.map((nf) => (
                                            <NFRow key={nf.chaveAcesso} nf={nf} onFiltrarEmitente={filtrarPorEmitente} onNavigate={navigate} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        {/* Mobile: lista de cards (sem scroll lateral) */}
                        <div className="grid gap-2.5 md:hidden" data-testid="data-cards">
                            {query.data.data.map((nf) => (
                                <NFCard key={nf.chaveAcesso} nf={nf} onFiltrarEmitente={filtrarPorEmitente} onNavigate={navigate} />
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {total !== undefined ? t('nf.paginaDe', { page, total }) : t('nf.pagina', { page })}
                            </span>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" disabled={cursores.length === 0} onClick={() => setCursores((c) => c.slice(0, -1))}>{t('nf.anterior')}</Button>
                                <Button type="button" variant="outline" size="sm" disabled={!query.data.pagination.hasMore} onClick={() => setCursores((c) => [...c, query.data!.pagination.nextCursor!])}>{t('nf.proxima')}</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} onUploaded={() => void query.refetch()} />}
        </div>
    );
}

/** Botão-ícone com tooltip para uma ação de linha. */
function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: JSX.Element }): JSX.Element {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>{children}</Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

/**
 * Ações de uma NF: as principais (ver, baixar XML, grafo) como ícones diretos,
 * o restante (copiar chave, filtrar por emitente) num menu "mais". Reutilizada
 * na linha da tabela (desktop) e no card (mobile).
 */
function NFActions({ nf, onFiltrarEmitente, onNavigate }: {
    nf: NFListItem;
    onFiltrarEmitente: (cnpj: string) => void;
    onNavigate: ReturnType<typeof useNavigate>;
}): JSX.Element {
    const { t } = useTranslation();
    const irDetalhe = (): void => void onNavigate({ to: '/nf/$chave' as string, params: { chave: nf.chaveAcesso } as never });
    const abrirGrafo = (): void => void onNavigate({ to: '/grafo' as string, search: { cnpj: nf.emitente!.cnpj } as never });

    return (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            <IconAction label={t('nf.verDetalhe')} onClick={irDetalhe}><Eye /></IconAction>
            <IconAction label={t('nf.baixarXml')} onClick={() => void downloadFile(`/nf/${nf.chaveAcesso}/xml`, `${nf.chaveAcesso}.xml`)}><Download /></IconAction>
            {nf.emitente?.cnpj && <IconAction label={t('nf.abrirGrafo')} onClick={abrirGrafo}><Waypoints /></IconAction>}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t('nf.maisAcoes')}><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => void navigator.clipboard?.writeText(nf.chaveAcesso)}>
                        <Copy /> {t('nf.copiarChave')}
                    </DropdownMenuItem>
                    {nf.emitente?.cnpj && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onFiltrarEmitente(nf.emitente!.cnpj)}>
                                {t('nf.filtrarEmitente')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/** Linha da tabela (desktop): clicável (→ detalhe) com ações-ícone à direita. */
function NFRow({ nf, onFiltrarEmitente, onNavigate }: {
    nf: NFListItem;
    onFiltrarEmitente: (cnpj: string) => void;
    onNavigate: ReturnType<typeof useNavigate>;
}): JSX.Element {
    const irDetalhe = (): void => void onNavigate({ to: '/nf/$chave' as string, params: { chave: nf.chaveAcesso } as never });

    return (
        <TableRow className="cursor-pointer" onClick={irDetalhe}>
            <TableCell onClick={(e) => e.stopPropagation()}><CopyableKey chave={nf.chaveAcesso} /></TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
                <Link className="font-medium text-primary hover:underline" to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}>{nf.numero}</Link>
            </TableCell>
            <TableCell><Parte p={nf.emitente} /></TableCell>
            <TableCell><Parte p={nf.destinatario} /></TableCell>
            <TableCell className="text-right"><CurrencyValue value={nf.valorTotal} /></TableCell>
            <TableCell><NFStatusBadge status={nf.status} /></TableCell>
            <TableCell><DateDisplay value={nf.dataEmissao} /></TableCell>
            <TableCell><NFActions nf={nf} onFiltrarEmitente={onFiltrarEmitente} onNavigate={onNavigate} /></TableCell>
        </TableRow>
    );
}

/** Card de NF (mobile): número + valor no topo, partes, status/data e ações. */
function NFCard({ nf, onFiltrarEmitente, onNavigate }: {
    nf: NFListItem;
    onFiltrarEmitente: (cnpj: string) => void;
    onNavigate: ReturnType<typeof useNavigate>;
}): JSX.Element {
    const { t } = useTranslation();
    const irDetalhe = (): void => void onNavigate({ to: '/nf/$chave' as string, params: { chave: nf.chaveAcesso } as never });

    return (
        <Card className="cursor-pointer gap-0 p-3.5" onClick={irDetalhe}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">{t('nf.numero')}</span>
                    <p className="font-semibold text-primary leading-tight">{nf.numero}</p>
                </div>
                <div className="text-right">
                    <CurrencyValue value={nf.valorTotal} />
                    <div className="mt-1"><NFStatusBadge status={nf.status} /></div>
                </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-baseline gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{t('nf.emitente')}</span>
                    <Parte p={nf.emitente} />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{t('nf.destinatario')}</span>
                    <Parte p={nf.destinatario} />
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                <span className="text-xs text-muted-foreground tabular-nums"><DateDisplay value={nf.dataEmissao} /></span>
                <NFActions nf={nf} onFiltrarEmitente={onFiltrarEmitente} onNavigate={onNavigate} />
            </div>
        </Card>
    );
}
