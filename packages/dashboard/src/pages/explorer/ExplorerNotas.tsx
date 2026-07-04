import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Download, Eye, Waypoints } from 'lucide-react';
import { useNFList, type NFListItem } from '../../api/hooks.js';
import { downloadFile } from '../../api/api.client.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { useDensityStore, densityClass } from '../../stores/density.store.js';
import { Card } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip.js';
import { NFPeek } from './NFPeek.js';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/** Ações inline da linha (ver/baixar/grafo) — não propagam o clique (que abre o peek). */
function RowActions({ nf, onView }: { nf: NFListItem; onView: () => void }): JSX.Element {
    const { t } = useTranslation();
    const stop = (e: React.MouseEvent): void => e.stopPropagation();
    return (
        <div className="flex items-center justify-end gap-0.5" onClick={stop}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t('nf.verDetalhe')} onClick={onView}><Eye /></Button>
                </TooltipTrigger>
                <TooltipContent>{t('nf.verDetalhe')}</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t('nf.baixarXml')} onClick={() => void downloadFile(`/nf/${nf.chaveAcesso}/xml`, `${nf.chaveAcesso}.xml`)}><Download /></Button>
                </TooltipTrigger>
                <TooltipContent>{t('nf.baixarXml')}</TooltipContent>
            </Tooltip>
            {nf.emitente?.cnpj && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={t('nf.abrirGrafo')}>
                            <Link to={'/grafo' as string} search={{ cnpj: nf.emitente.cnpj } as never}><Waypoints /></Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('nf.abrirGrafo')}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

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
    const query = useNFList({ limit: 50, orderBy: 'dataEmissao', order: 'desc', ...(q ? { q } : {}), ...(status ? { status } : {}), ...recorte });
    const rows = query.data?.data ?? [];

    if (query.isLoading) return <LoadingSkeleton variant="table" linhas={10} colunas={6} />;
    if (query.isError) return <InlineError onRetry={() => void query.refetch()} />;
    if (rows.length === 0) return <EmptyState />;

    // seleção derivada da URL (peek = chave) → o peek é linkável e o voltar funciona
    const sel = peek ? rows.findIndex((r) => r.chaveAcesso === peek) : -1;
    const selNf: NFListItem | null = sel >= 0 ? (rows[sel] ?? null) : null;
    const goTo = (i: number): void => { const r = rows[i]; if (r) onPeek(r.chaveAcesso); };

    return (
        <>
            {/* Desktop: tabela densa (sticky header; densidade via store) */}
            <div className="hidden max-h-[calc(100svh-8.5rem)] overflow-auto md:block">
                <Table data-testid="data-table" data-sticky className={densityClass(density)}>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14">{t('nf.numero')}</TableHead>
                            <TableHead>{t('nf.chave')}</TableHead>
                            <TableHead>{t('nf.emitente')}</TableHead>
                            <TableHead>{t('nf.destinatario')}</TableHead>
                            <TableHead className="text-right">{t('nf.valor')}</TableHead>
                            <TableHead>{t('nf.status')}</TableHead>
                            <TableHead>{t('nf.emissao')}</TableHead>
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
                                <TableCell><RowActions nf={nf} onView={() => onPeek(nf.chaveAcesso)} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
