import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from '@tanstack/react-router';
import { Download, Eye, Upload } from 'lucide-react';
import { useNFList } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { NFStatusBadge, CNPJText, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { UploadModal } from '../components/UploadModal.js';
import { NFFilterBar } from '../components/NFFilterBar.js';
import { type NFFiltros } from '../components/FilterSidebar.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip.js';

/** Página de listagem de NFs: barra de filtros no topo + tabela em largura total. */
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

    // Deep-link na MESMA rota re-semeia os filtros a partir do search.
    useEffect(() => {
        setFiltros({
            ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
            ...(search.ncm ? { ncm: search.ncm } : {}),
            ...(search.comImposto ? { comImposto: true } : {}),
        });
        setStatus(search.status ?? '');
        setCursores([]);
    }, [search.cnpjEmitente, search.ncm, search.comImposto, search.status]);

    // Busca/status resetam a paginação.
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

    const page = cursores.length + 1;
    const shown = query.data?.data.length ?? 0;
    const total = query.data?.meta?.total;

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

            <div className="space-y-4">
                <NFFilterBar
                    q={qInput}
                    onQ={setQInput}
                    status={status}
                    onStatus={setStatus}
                    filtros={filtros}
                    onFiltros={aplicarSidebar}
                    shown={shown}
                    total={total}
                />

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

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {total !== undefined ? t('nf.paginaDe', { page, total }) : t('nf.pagina', { page })}
                            </span>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" disabled={cursores.length === 0} onClick={() => setCursores((c) => c.slice(0, -1))}>
                                    {t('nf.anterior')}
                                </Button>
                                <Button type="button" variant="outline" size="sm" disabled={!query.data.pagination.hasMore} onClick={() => setCursores((c) => [...c, query.data!.pagination.nextCursor!])}>
                                    {t('nf.proxima')}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} onUploaded={() => void query.refetch()} />}
        </div>
    );
}
