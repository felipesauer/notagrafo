import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from '@tanstack/react-router';
import { ReactFlow, Background, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import {
    ArrowUpFromLine,
    Ban,
    Check,
    CircleAlert,
    Download,
    Eye,
    Network,
    Upload,
    type LucideIcon,
} from 'lucide-react';
import { useNFDetail, useNFEvents } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { useThemeStore } from '../stores/theme.store.js';
import { NFStatusBadge, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { GraphDrawer } from '../graph/GraphDrawer.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

/** Ícone lucide da timeline por tipo de evento (fallback genérico). */
const EVENTO_ICONE: Record<string, LucideIcon> = {
    importada: Upload,
    processada: Check,
    cancelada: Ban,
    consultada: Eye,
    exportada: Download,
    erro: CircleAlert,
};

/** Mini-grafo fixo Emitente → NotaFiscal → Destinatário (React Flow). */
function MiniGrafo({ emitente, destinatario, numero }: { emitente?: { razaoSocial?: string; cnpj?: string }; destinatario?: { razaoSocial?: string; cnpj?: string }; numero?: string }): JSX.Element {
    const nodes: Node[] = [
        { id: 'emit', position: { x: 0, y: 0 }, data: { label: emitente?.razaoSocial ?? '—' }, sourcePosition: 'right' as never, type: 'input' },
        { id: 'nf', position: { x: 180, y: 0 }, data: { label: `NF ${numero ?? ''}` }, sourcePosition: 'right' as never, targetPosition: 'left' as never },
        { id: 'dest', position: { x: 360, y: 0 }, data: { label: destinatario?.razaoSocial ?? '—' }, targetPosition: 'left' as never, type: 'output' },
    ];
    const edges: Edge[] = [
        { id: 'e1', source: 'emit', target: 'nf', label: 'emitiu' },
        { id: 'e2', source: 'nf', target: 'dest', label: 'destinada a' },
    ];
    return (
        <div className="h-40 overflow-hidden rounded-md border bg-muted/20">
            <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
                <Background />
            </ReactFlow>
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
    const router = useRouter();
    const tema = useThemeStore((s) => s.tema);
    const { chave } = useParams({ strict: false }) as { chave: string };
    const { data, isLoading, isError, refetch } = useNFDetail(chave);
    const eventos = useNFEvents(chave);
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
                onBack={() => router.history.back()}
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

                {/* Coluna lateral: grafo + eventos */}
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

                    <Card className="py-4">
                        <CardHeader className="px-4 pb-0"><CardTitle className="text-sm">{t('nf.eventos')}</CardTitle></CardHeader>
                        <CardContent className="px-4">
                            {eventos.isLoading ? (
                                <LoadingSkeleton linhas={2} />
                            ) : eventos.isError ? (
                                <InlineError onRetry={() => void eventos.refetch()} />
                            ) : (eventos.data?.eventos.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('nf.semEventos')}</p>
                            ) : (
                                <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
                                    {eventos.data!.eventos.map((ev, i) => {
                                        const Icon = EVENTO_ICONE[ev.tipo] ?? ArrowUpFromLine;
                                        return (
                                            <li key={i} className="relative">
                                                <span className="absolute -left-[27px] flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-3">
                                                    <Icon />
                                                </span>
                                                <p className="text-sm font-medium capitalize">{ev.tipo}</p>
                                                <p className="text-xs text-muted-foreground"><DateDisplay value={ev.timestamp} /></p>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            {nf.emitente?.cnpj && (
                <GraphDrawer cnpj={nf.emitente.cnpj} open={grafoAberto} onOpenChange={setGrafoAberto} dark={tema === 'escuro'} />
            )}
        </div>
    );
}
