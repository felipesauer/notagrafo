import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Ban, Check, CircleAlert, Download, Eye, Upload, type LucideIcon } from 'lucide-react';
import { useEventos } from '../api/hooks.js';
import { DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { FadeIn } from '../components/Motion.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { NativeSelect } from '../components/ui/native-select.js';

/** Ícone lucide por tipo de evento (fallback genérico). */
const EVENTO_ICONE: Record<string, LucideIcon> = {
    importada: Upload,
    processada: Check,
    cancelada: Ban,
    consultada: Eye,
    exportada: Download,
    erro: CircleAlert,
};

const PAGE = 50;

/** Feed global de eventos de auditoria de todas as NFs, agrupado por dia. */
export function EventsPage(): JSX.Element {
    const { t } = useTranslation();
    const [tipo, setTipo] = useState('');
    const [pagina, setPagina] = useState(0);
    const query = useEventos({ limit: PAGE, offset: pagina * PAGE, ...(tipo ? { tipo } : {}) });

    const eventos = query.data?.eventos ?? [];
    const total = query.data?.total ?? 0;
    const ultimaPagina = Math.max(0, Math.ceil(total / PAGE) - 1);

    function mudarTipo(v: string): void {
        setTipo(v);
        setPagina(0);
    }

    return (
        <div>
            <PageHeader title={t('eventos.titulo')} description={t('eventos.subtitulo')} />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <NativeSelect value={tipo} onChange={(e) => mudarTipo(e.target.value)} wrapperClassName="w-52">
                    <option value="">{t('eventos.todosTipos')}</option>
                    <option value="importada">{t('eventos.tipo.importada')}</option>
                    <option value="processada">{t('eventos.tipo.processada')}</option>
                    <option value="consultada">{t('eventos.tipo.consultada')}</option>
                    <option value="exportada">{t('eventos.tipo.exportada')}</option>
                    <option value="cancelada">{t('eventos.tipo.cancelada')}</option>
                    <option value="erro">{t('eventos.tipo.erro')}</option>
                </NativeSelect>
                {total > 0 && <span className="text-xs text-muted-foreground tabular-nums">{t('eventos.contagem', { total })}</span>}
            </div>

            {query.isLoading ? (
                <LoadingSkeleton variant="card" />
            ) : query.isError ? (
                <InlineError onRetry={() => void query.refetch()} />
            ) : eventos.length === 0 ? (
                <Card><CardContent className="py-12"><EmptyState mensagem={t('eventos.vazio')} /></CardContent></Card>
            ) : (
                <FadeIn>
                    <Card className="py-0">
                        <CardContent className="p-0">
                            <ol className="divide-y">
                                {eventos.map((ev, i) => {
                                    const Icon = EVENTO_ICONE[ev.tipo] ?? CircleAlert;
                                    return (
                                        <li key={`${ev.chaveAcesso}-${ev.timestamp}-${i}`} className="flex items-center gap-3 px-4 py-3">
                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-4">
                                                <Icon />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium capitalize">{ev.tipo}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('eventos.naNota')}{' '}
                                                    <Link className="text-primary hover:underline" to={'/nf/$chave' as string} params={{ chave: ev.chaveAcesso } as never}>
                                                        NF {ev.numero}
                                                    </Link>
                                                    {ev.autor ? ` · ${ev.autor}` : ''}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                <DateDisplay value={ev.timestamp} />
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </CardContent>
                    </Card>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground tabular-nums">{t('eventos.paginaDe', { page: pagina + 1, total: ultimaPagina + 1 })}</span>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina((p) => Math.max(0, p - 1))}>{t('nf.anterior')}</Button>
                            <Button type="button" variant="outline" size="sm" disabled={pagina >= ultimaPagina} onClick={() => setPagina((p) => p + 1)}>{t('nf.proxima')}</Button>
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    );
}
