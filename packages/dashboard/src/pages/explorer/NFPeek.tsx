import { type JSX, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Building2, ChevronDown, ChevronUp, Copy, Download, FileText, Waypoints, X } from 'lucide-react';
import { type NFListItem } from '../../api/hooks.js';
import { downloadFile } from '../../api/api.client.js';
import { NFStatusBadge, CurrencyValue, DateDisplay } from '../../components/shared.js';
import { Sheet, SheetContent } from '../../components/ui/sheet.js';
import { Button } from '../../components/ui/button.js';

const cnpjFmt = (c?: string): string =>
    c && c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : (c ?? '—');

/** Nó do fluxo emitente → nota → destinatário no peek. */
function FlowNode({ icon, papel, nome, color }: { icon: JSX.Element; papel: string; nome: string; color: string }): JSX.Element {
    return (
        <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-white [&>svg]:size-4" style={{ background: color }}>{icon}</span>
            <div className="min-w-0">
                <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{papel}</p>
                <p className="truncate text-sm font-medium" title={nome}>{nome}</p>
            </div>
        </div>
    );
}

/**
 * Peek (prévia in-place, estilo Linear) de uma NF: drawer lateral (Sheet) que
 * mostra o essencial sem sair da lista. Navega por ↑/↓ entre as NFs adjacentes
 * mantendo a posição; Enter/"Abrir detalhe" vai para a página completa.
 */
export function NFPeek({
    nf,
    open,
    onOpenChange,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
}: {
    nf: NFListItem | null;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}): JSX.Element {
    const { t } = useTranslation();

    // ↑/↓ navegam entre NFs adjacentes enquanto o peek está aberto.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent): void {
            const el = document.activeElement;
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); onNext(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); onPrev(); }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onPrev, onNext]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-[440px] max-w-[92vw] flex-col gap-0 p-0" data-testid="nf-peek">
                {nf && (
                    <>
                        <div className="flex items-center gap-2 border-b px-4 py-3">
                            <NFStatusBadge status={nf.status} />
                            <div className="ml-auto flex gap-0.5">
                                <Button type="button" variant="ghost" size="icon-sm" disabled={!hasPrev} onClick={onPrev} aria-label={t('nf.anterior')}><ChevronUp /></Button>
                                <Button type="button" variant="ghost" size="icon-sm" disabled={!hasNext} onClick={onNext} aria-label={t('nf.proxima')}><ChevronDown /></Button>
                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label={t('comum.fechar')}><X /></Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <h2 className="text-lg font-semibold leading-tight tracking-tight">{t('nf.notaN', { n: nf.numero })}</h2>
                            <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">{nf.chaveAcesso}</p>

                            <dl className="mt-4 grid grid-cols-[92px_1fr] gap-x-3 gap-y-2 text-[13px]">
                                <dt className="text-muted-foreground">{t('nf.valor')}</dt>
                                <dd className="font-mono font-medium tabular-nums"><CurrencyValue value={nf.valorTotal} /></dd>
                                <dt className="text-muted-foreground">{t('nf.emissao')}</dt>
                                <dd className="font-mono tabular-nums"><DateDisplay value={nf.dataEmissao} /></dd>
                                <dt className="text-muted-foreground">{t('nf.filtros.serie')}</dt>
                                <dd className="font-mono tabular-nums">{nf.serie}</dd>
                            </dl>

                            <p className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('nf.fluxo')}</p>
                            <div className="space-y-0">
                                <FlowNode icon={<Building2 />} papel={t('nf.emitente')} nome={nf.emitente?.razaoSocial || cnpjFmt(nf.emitente?.cnpj)} color="var(--chart-1)" />
                                <div className="ml-[15px] h-3 w-px bg-border" />
                                <FlowNode icon={<FileText />} papel={t('nf.numero')} nome={`NF ${nf.numero}`} color="var(--chart-2)" />
                                <div className="ml-[15px] h-3 w-px bg-border" />
                                <FlowNode icon={<Building2 />} papel={t('nf.destinatario')} nome={nf.destinatario?.razaoSocial || cnpjFmt(nf.destinatario?.cnpj)} color="var(--chart-3)" />
                            </div>
                        </div>

                        <div className="flex gap-2 border-t p-3">
                            <Button type="button" variant="outline" size="sm" onClick={() => void downloadFile(`/nf/${nf.chaveAcesso}/xml`, `${nf.chaveAcesso}.xml`)}><Download /> {t('nf.baixarXml')}</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(nf.chaveAcesso)} aria-label={t('nf.copiarChave')}><Copy /></Button>
                            {nf.emitente?.cnpj && (
                                <Button asChild type="button" variant="outline" size="sm" aria-label={t('nf.abrirGrafo')}>
                                    <Link to={'/grafo' as string} search={{ cnpj: nf.emitente.cnpj } as never}><Waypoints /></Link>
                                </Button>
                            )}
                            <Button asChild type="button" size="sm" className="ml-auto">
                                <Link to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}>{t('nf.abrirDetalhe')} →</Link>
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
