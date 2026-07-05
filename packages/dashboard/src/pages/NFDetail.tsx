import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Activity, Building2, Download, FileText, Network } from 'lucide-react';
import { useNFDetail, useNFEvents } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { useThemeStore } from '../stores/theme.store.js';
import { NFStatusBadge, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { GraphDrawer } from '../graph/GraphDrawer.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

/** Mini-grafo fixo Emitente → NotaFiscal → Destinatário (React Flow). */
/** Um passo do fluxo (emitente / NF / destinatário) no mini-grafo. */
function FluxoNo({ icon, papel, nome, color }: { icon: JSX.Element; papel: string; nome: string; color: string }): JSX.Element {
    return (
        <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-white [&>svg]:size-4" style={{ background: color }}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{papel}</p>
                <p className="truncate text-sm font-medium" title={nome}>{nome}</p>
            </div>
        </div>
    );
}

/**
 * Mini-grafo do fluxo desta NF: emitente → nota → destinatário, como cards
 * legíveis conectados verticalmente (o React Flow miniatura ficava espremido e
 * ilegível na coluna estreita). O grafo interativo completo abre no drawer.
 */
function MiniGrafo({ emitente, destinatario, numero }: { emitente?: { razaoSocial?: string; cnpj?: string }; destinatario?: { razaoSocial?: string; cnpj?: string }; numero?: string }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="space-y-0">
            <FluxoNo icon={<Building2 />} papel={t('nf.emitente')} nome={emitente?.razaoSocial ?? '—'} color="var(--chart-1)" />
            <div className="ml-[15px] h-3 w-px bg-border" />
            <FluxoNo icon={<FileText />} papel={t('nf.numero')} nome={`NF ${numero ?? ''}`} color="var(--chart-2)" />
            <div className="ml-[15px] h-3 w-px bg-border" />
            <FluxoNo icon={<Building2 />} papel={t('nf.destinatario')} nome={destinatario?.razaoSocial ?? '—'} color="var(--chart-3)" />
        </div>
    );
}

interface Tributos {
    vICMS?: number;
    vICMSST?: number;
    vFCP?: number;
    vIPI?: number;
    vPIS?: number;
    vCOFINS?: number;
    vII?: number;
    vISSQN?: number;
}

interface Item {
    numeroItem?: number;
    quantidade?: number;
    valorTotal?: number;
    produto?: { descricao?: string; codigo?: string; ncm?: { codigo?: string; descricao?: string } };
    tributos?: Tributos;
}

interface Totais {
    vNF?: number;
    vICMS?: number;
    vIPI?: number;
    vPIS?: number;
    vCOFINS?: number;
    vDesc?: number;
}

/** Valor monetário compacto para células (— quando ausente). */
function Money({ value }: { value?: number }): JSX.Element {
    if (value === undefined || value === null) return <span className="text-muted-foreground">—</span>;
    return <span className="tabular-nums">{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

/** Item de definição (rótulo + valor) para os cards de dados. */
function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

/** Detalhe de uma NF: dados + CFOP, itens com NCM e tributos, totais, mini-grafo e eventos. */
export function NFDetailPage(): JSX.Element {
    const { t } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const { chave } = useParams({ strict: false }) as { chave: string };
    const { data, isLoading, isError, refetch } = useNFDetail(chave);
    const [grafoAberto, setGrafoAberto] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="card" />;
    if (isError || !data) return <InlineError onRetry={() => void refetch()} />;

    const nf = data as Record<string, unknown> & {
        numero?: string;
        status?: string;
        valorTotal?: number;
        dataEmissao?: string;
        emitente?: { razaoSocial?: string; cnpj?: string };
        destinatario?: { razaoSocial?: string; cnpj?: string };
        cfop?: { codigo?: string; descricao?: string };
        itens?: Item[];
        totais?: Totais;
    };
    const itens = nf.itens ?? [];
    const totais = nf.totais ?? {};

    function baixarXml(): void {
        void downloadFile(`/nf/${chave}/xml`, `${chave}.xml`).then(() => toast.success(t('nf.baixarXml')));
    }

    return (
        <div>
            <PageHeader
                title={`${t('nf.detalheTitulo')} ${nf.numero ?? ''}`}
                actions={
                    <Button type="button" variant="outline" onClick={baixarXml}>
                        <Download /> {t('nf.baixarXml')}
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="min-w-0 space-y-6">
                    {/* Cards de dados */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="py-4">
                            <CardHeader className="px-4 pb-0"><CardTitle className="text-sm">{t('nf.detalheTitulo')}</CardTitle></CardHeader>
                            <CardContent className="px-4">
                                <dl className="grid gap-3">
                                    <Field label={t('nf.chave')}><CopyableKey chave={chave} truncate={false} /></Field>
                                    <Field label={t('nf.status')}><NFStatusBadge status={nf.status ?? 'ativa'} /></Field>
                                    <Field label={t('nf.valor')}><CurrencyValue value={nf.valorTotal ?? 0} /></Field>
                                    <Field label={t('nf.emissao')}><DateDisplay value={nf.dataEmissao} /></Field>
                                </dl>
                            </CardContent>
                        </Card>
                        <Card className="py-4">
                            <CardHeader className="px-4 pb-0"><CardTitle className="text-sm">{t('nf.emitente')} / {t('nf.destinatario')}</CardTitle></CardHeader>
                            <CardContent className="px-4">
                                <dl className="grid gap-3">
                                    <Field label={t('nf.emitente')}>{nf.emitente?.razaoSocial ?? '—'}</Field>
                                    <Field label={t('nf.destinatario')}>{nf.destinatario?.razaoSocial ?? '—'}</Field>
                                    {nf.cfop?.codigo && (
                                        <Field label={t('nf.cfop')}>{nf.cfop.codigo}{nf.cfop.descricao ? ` — ${nf.cfop.descricao}` : ''}</Field>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Itens */}
                    <Card className="py-4">
                        <CardHeader className="px-4 pb-0"><CardTitle className="text-base"><h3>{t('nf.itens')}</h3></CardTitle></CardHeader>
                        <CardContent className="px-0">
                            <div className="overflow-x-auto">
                                <Table data-testid="data-table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">#</TableHead>
                                            <TableHead>{t('nf.produto')}</TableHead>
                                            <TableHead>{t('nf.ncm')}</TableHead>
                                            <TableHead className="text-right">{t('nf.qtd')}</TableHead>
                                            <TableHead className="text-right">{t('nf.valor')}</TableHead>
                                            <TableHead className="text-right">{t('nf.icms')}</TableHead>
                                            <TableHead className="text-right">{t('nf.ipi')}</TableHead>
                                            <TableHead className="text-right">{t('nf.pis')}</TableHead>
                                            <TableHead className="pr-4 text-right">{t('nf.cofins')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {itens.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="pl-4">{item.numeroItem ?? i + 1}</TableCell>
                                                <TableCell>{item.produto?.descricao ?? '—'}</TableCell>
                                                <TableCell title={item.produto?.ncm?.descricao ?? ''} className="tabular-nums">{item.produto?.ncm?.codigo ?? '—'}</TableCell>
                                                <TableCell className="text-right tabular-nums">{item.quantidade ?? 0}</TableCell>
                                                <TableCell className="text-right"><CurrencyValue value={item.valorTotal ?? 0} /></TableCell>
                                                <TableCell className="text-right"><Money value={item.tributos?.vICMS} /></TableCell>
                                                <TableCell className="text-right"><Money value={item.tributos?.vIPI} /></TableCell>
                                                <TableCell className="text-right"><Money value={item.tributos?.vPIS} /></TableCell>
                                                <TableCell className="pr-4 text-right"><Money value={item.tributos?.vCOFINS} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {(totais.vNF !== undefined || totais.vICMS !== undefined) && (
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={5} className="pl-4">
                                                    {t('nf.totais')} · {t('nf.valorNF')}: <CurrencyValue value={totais.vNF ?? nf.valorTotal ?? 0} />
                                                </TableCell>
                                                <TableCell className="text-right"><Money value={totais.vICMS} /></TableCell>
                                                <TableCell className="text-right"><Money value={totais.vIPI} /></TableCell>
                                                <TableCell className="text-right"><Money value={totais.vPIS} /></TableCell>
                                                <TableCell className="pr-4 text-right"><Money value={totais.vCOFINS} /></TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna lateral: mini-grafo + timeline de eventos (auditoria da NF) */}
                <aside className="space-y-6">
                    <Card className="py-4">
                        <CardHeader className="px-4 pb-0"><CardTitle className="text-sm">{t('nf.miniGrafo')}</CardTitle></CardHeader>
                        <CardContent className="space-y-3 px-4">
                            <MiniGrafo emitente={nf.emitente} destinatario={nf.destinatario} numero={nf.numero} />
                            {nf.emitente?.cnpj && (
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setGrafoAberto(true)}>
                                    <Network /> {t('nf.verNoGrafo')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    <EventosTimeline chave={chave} />
                </aside>
            </div>

            {nf.emitente?.cnpj && (
                <GraphDrawer cnpj={nf.emitente.cnpj} open={grafoAberto} onOpenChange={setGrafoAberto} dark={tema === 'escuro'} />
            )}
        </div>
    );
}

/** Cor do ponto por tipo de evento (auditoria). Desconhecido → cinza. */
const EVENTO_COR: Record<string, string> = {
    importada: 'var(--chart-1)',
    processada: 'var(--status-ativa)',
    consultada: 'var(--chart-5)',
    exportada: 'var(--chart-3)',
    cancelada: 'var(--status-cancelada)',
    erro: 'var(--status-cancelada)',
};

/**
 * Timeline de eventos da NF (redesign BI / NOTA-125 C): consome useNFEvents (hook
 * que existia mas estava órfão — a auditoria dos eventos por-NF vinha sendo perdida
 * no detalhe). Some quando não há eventos.
 */
function EventosTimeline({ chave }: { chave: string }): JSX.Element | null {
    const { t } = useTranslation();
    const { data } = useNFEvents(chave);
    const eventos = data?.eventos ?? [];
    if (eventos.length === 0) return null;
    return (
        <Card className="py-4">
            <CardHeader className="px-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm"><Activity className="size-4 text-muted-foreground" /> {t('nf.eventos')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
                <ol className="space-y-0">
                    {eventos.map((e, i) => (
                        <li key={`${e.tipo}-${e.timestamp}-${i}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: EVENTO_COR[e.tipo] ?? 'var(--muted-foreground)' }} />
                                {i < eventos.length - 1 && <span className="w-px flex-1 bg-border" />}
                            </div>
                            <div className="pb-3">
                                <p className="text-[13px] font-medium capitalize leading-tight">{t(`eventos.tipo.${e.tipo}`, { defaultValue: e.tipo })}</p>
                                <p className="text-[11px] text-muted-foreground tabular-nums"><DateDisplay value={e.timestamp} />{e.autor ? ` · ${e.autor}` : ''}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    );
}
