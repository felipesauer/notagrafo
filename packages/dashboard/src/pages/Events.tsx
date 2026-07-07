import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Ban, Check, CircleAlert, Download, Eye, Upload, type LucideIcon } from 'lucide-react';
import { useEventos } from '../api/hooks.js';
import { DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { FadeIn } from '../components/Motion.js';
import { Card, CardContent } from '../components/ui/card.js';
import { TablePagination } from '../components/TablePagination.js';
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

/** Feed global de eventos de auditoria de todas as NFs, agrupado por dia. */
/** Conteúdo do feed de eventos sem PageHeader — reutilizado na página standalone e no explorador. */
export function EventsContent(): JSX.Element {
    const { t } = useTranslation();
    const [tipo, setTipo] = useState('');
    const [pagina, setPagina] = useState(0);
    const [pageSize, setPageSize] = useState(10); // paginação offset/limit server-side (NOTA-150)
    const query = useEventos({ limit: pageSize, offset: pagina * pageSize, ...(tipo ? { tipo } : {}) });

    const eventos = query.data?.eventos ?? [];
    const total = query.data?.total ?? 0;
    const ultimaPagina = Math.max(0, Math.ceil(total / pageSize) - 1);

    function mudarTipo(v: string): void {
        setTipo(v);
        setPagina(0);
    }

    return (
        <div>
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

                    <div className="mt-2 rounded-lg border">
                        <TablePagination
                            page={pagina}
                            pageSize={pageSize}
                            total={total}
                            hasPrev={pagina > 0}
                            hasNext={pagina < ultimaPagina}
                            onPrev={() => setPagina((p) => Math.max(0, p - 1))}
                            onNext={() => setPagina((p) => p + 1)}
                            onPageSize={(n) => { setPageSize(n); setPagina(0); }}
                        />
                    </div>
                </FadeIn>
            )}
        </div>
    );
}

export function EventsPage(): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('eventos.titulo')} description={t('eventos.subtitulo')} />
            <EventsContent />
        </div>
    );
}
