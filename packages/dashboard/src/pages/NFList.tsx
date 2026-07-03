import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from '@tanstack/react-router';
import { Download, Eye, Search, Upload, X } from 'lucide-react';
import { useNFList } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { NFStatusBadge, CNPJText, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { UploadModal } from '../components/UploadModal.js';
import { FilterSidebar, filtrosAtivos, filtroLabel, type NFFiltros } from '../components/FilterSidebar.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Badge } from '../components/ui/badge.js';
import { Card } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip.js';

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Página de listagem de NFs: toolbar + FilterSidebar (acordeão) + tabela com paginação cursor. */
export function NFListPage(): JSX.Element {
    const { t } = useTranslation();
    // Filtros vindos por deep-link (Empresas/Grafo): semeiam o estado inicial.
    const search = useSearch({ strict: false }) as { cnpjEmitente?: string; ncm?: string; comImposto?: boolean; status?: string };
    const [status, setStatus] = useState(search.status ?? '');
    const [qInput, setQInput] = useState('');
    const q = useDebouncedValue(qInput, 300);
    const [filtros, setFiltros] = useState<NFFiltros>(() => ({
        ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
        ...(search.ncm ? { ncm: search.ncm } : {}),
        ...(search.comImposto ? { comImposto: true } : {}),
    }));
    const [cursores, setCursores] = useState<string[]>([]);
    const [modalAberto, setModalAberto] = useState(false);

    // Deep-link na MESMA rota re-semeia os filtros a partir do search (M1).
    useEffect(() => {
        setFiltros({
            ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
            ...(search.ncm ? { ncm: search.ncm } : {}),
            ...(search.comImposto ? { comImposto: true } : {}),
        });
        setStatus(search.status ?? '');
        setCursores([]);
    }, [search.cnpjEmitente, search.ncm, search.comImposto, search.status]);

    // Busca (debounced) reseta a paginação.
    useEffect(() => {
        setCursores([]);
    }, [q, status]);

    const cursorAtual = cursores[cursores.length - 1];
    const query = useNFList({
        limit: 20,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
        ...filtros,
        ...(cursorAtual ? { cursor: cursorAtual } : {}),
    });

    function aplicarSidebar(novosFiltros: NFFiltros): void {
        setCursores([]);
        setFiltros(novosFiltros);
    }

    function removerFiltro(campo: keyof NFFiltros): void {
        setCursores([]);
        setFiltros((f) => {
            const resto = { ...f };
            delete resto[campo];
            return resto;
        });
    }

    const chips = filtrosAtivos(filtros);

    return (
        <div>
            <PageHeader
                title={t('sidebar.nfs')}
                actions={
                    <Button type="button" onClick={() => setModalAberto(true)}>
                        <Upload /> {t('nf.uploadTitulo')}
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <Card className="h-fit p-4">
                    <FilterSidebar valor={filtros} onAplicar={aplicarSidebar} />
                </Card>

                <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-48">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('comum.buscar')}
                                value={qInput}
                                onChange={(e) => setQInput(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            data-testid="nf-status-filter"
                            className={selectClass}
                        >
                            <option value="">{t('nf.todosStatus')}</option>
                            <option value="ativa">{t('nf.statusAtiva')}</option>
                            <option value="cancelada">{t('nf.statusCancelada')}</option>
                            <option value="denegada">{t('nf.statusDenegada')}</option>
                            <option value="inutilizada">{t('nf.statusInutilizada')}</option>
                        </select>
                    </div>

                    {chips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t('nf.filtros.ativos', { count: chips.length })}</span>
                            {chips.map(([campo, valor]) => (
                                <Badge key={campo} variant="secondary" className="gap-1 pr-1">
                                    <span className="text-muted-foreground">{filtroLabel(t, campo)}:</span> {valor}
                                    <button
                                        type="button"
                                        onClick={() => removerFiltro(campo)}
                                        aria-label={`${t('nf.filtros.remover')} ${filtroLabel(t, campo)}`}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {query.isLoading && <LoadingSkeleton variant="table" linhas={8} colunas={8} />}
                    {query.isError && <InlineError onRetry={() => void query.refetch()} />}
                    {query.data && query.data.data.length === 0 && <EmptyState />}

                    {query.data && query.data.data.length > 0 && (
                        <>
                            <Card className="overflow-hidden py-0">
                                <div className="overflow-x-auto">
                                    <Table data-testid="data-table">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('nf.chave')}</TableHead>
                                                <TableHead>{t('nf.numero')}</TableHead>
                                                <TableHead>{t('nf.emitente')}</TableHead>
                                                <TableHead>{t('nf.destinatario')}</TableHead>
                                                <TableHead className="text-right">{t('nf.valor')}</TableHead>
                                                <TableHead>{t('nf.status')}</TableHead>
                                                <TableHead>{t('nf.emissao')}</TableHead>
                                                <TableHead className="text-right">{t('nf.acoes')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {query.data.data.map((nf) => (
                                                <TableRow key={nf.chaveAcesso}>
                                                    <TableCell><CopyableKey chave={nf.chaveAcesso} /></TableCell>
                                                    <TableCell>
                                                        <Link className="font-medium text-primary hover:underline" to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}>
                                                            {nf.numero}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{nf.emitente ? <CNPJText cnpj={nf.emitente.cnpj} /> : '—'}</TableCell>
                                                    <TableCell>{nf.destinatario ? <CNPJText cnpj={nf.destinatario.cnpj} /> : '—'}</TableCell>
                                                    <TableCell className="text-right"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                                    <TableCell><NFStatusBadge status={nf.status} /></TableCell>
                                                    <TableCell><DateDisplay value={nf.dataEmissao} /></TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button asChild variant="ghost" size="icon-sm" aria-label={t('nf.verDetalhe')}>
                                                                        <Link to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}><Eye /></Link>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('nf.verDetalhe')}</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        aria-label={t('nf.baixarXml')}
                                                                        onClick={() => void downloadFile(`/nf/${nf.chaveAcesso}/xml`, `${nf.chaveAcesso}.xml`)}
                                                                    >
                                                                        <Download />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('nf.baixarXml')}</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" disabled={cursores.length === 0} onClick={() => setCursores((c) => c.slice(0, -1))}>
                                    {t('nf.anterior')}
                                </Button>
                                <Button type="button" variant="outline" size="sm" disabled={!query.data.pagination.hasMore} onClick={() => setCursores((c) => [...c, query.data!.pagination.nextCursor!])}>
                                    {t('nf.proxima')}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} onUploaded={() => void query.refetch()} />}
        </div>
    );
}
