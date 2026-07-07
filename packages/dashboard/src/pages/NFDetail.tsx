import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Building2, Download, FileText, Network } from 'lucide-react';
import { useNFDetail } from '../api/hooks.js';
import { downloadFile } from '../api/api.client.js';
import { useThemeStore } from '../stores/theme.store.js';
import { NFStatusBadge, CopyableKey, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';
import { useDensityStore, densityClass, type Density } from '../stores/density.store.js';
import { SortableHead } from '../components/SortableHead.js';
import { useTableSort } from '../hooks/useTableSort.js';
import { type TFunction } from 'i18next';
import { PageHeader } from '../components/PageHeader.js';
import { PageContainer } from '../components/layout/PageContainer.js';
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
                <p className="text-2xs uppercase tracking-wide text-muted-foreground">{papel}</p>
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
    const density = useDensityStore((s) => s.density);

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
        <PageContainer width="wide">
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
                    <ItensTable itens={itens} totais={totais} density={density} valorNF={nf.valorTotal} t={t} />
                </div>

                {/* Coluna lateral: mini-grafo do fluxo (eventos removidos do detalhe,
                    ADR NOTA-ADR-15 — a auditoria vive na lente Eventos do Explorer). */}
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
                </aside>
            </div>

            {nf.emitente?.cnpj && (
                <GraphDrawer cnpj={nf.emitente.cnpj} open={grafoAberto} onOpenChange={setGrafoAberto} dark={tema === 'escuro'} />
            )}
        </PageContainer>
    );
}

/** Tabela de itens da NF — ordenável (produto/NCM/qtd/valor) client-side, com
 *  o rodapé de totais preservado. Sem paginação (itens de uma nota são poucos). */
function ItensTable({ itens, totais, density, valorNF, t }: { itens: Item[]; totais: Totais; density: Density; valorNF?: number; t: TFunction }): JSX.Element {
    const { sorted, toggle, ariaSort } = useTableSort(itens, {
        produto: (i) => i.produto?.descricao ?? '',
        ncm: (i) => i.produto?.ncm?.codigo ?? '',
        quantidade: (i) => i.quantidade ?? 0,
        valorTotal: (i) => i.valorTotal ?? 0,
    });
    return (
        <Card className="py-4">
            <CardHeader className="px-4 pb-0"><CardTitle className="text-base"><h3>{t('nf.itens')}</h3></CardTitle></CardHeader>
            <CardContent className="px-0">
                <Table data-testid="data-table" data-zebra className={densityClass(density)}>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4">#</TableHead>
                            <SortableHead sortKey="produto" ariaSort={ariaSort} onToggle={toggle}>{t('nf.produto')}</SortableHead>
                            <SortableHead sortKey="ncm" ariaSort={ariaSort} onToggle={toggle}>{t('nf.ncm')}</SortableHead>
                            <SortableHead sortKey="quantidade" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('nf.qtd')}</SortableHead>
                            <SortableHead sortKey="valorTotal" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('nf.valor')}</SortableHead>
                            <TableHead className="text-right">{t('nf.icms')}</TableHead>
                            <TableHead className="text-right">{t('nf.ipi')}</TableHead>
                            <TableHead className="text-right">{t('nf.pis')}</TableHead>
                            <TableHead className="pr-4 text-right">{t('nf.cofins')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((item, i) => (
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
                                    {t('nf.totais')} · {t('nf.valorNF')}: <CurrencyValue value={totais.vNF ?? valorNF ?? 0} />
                                </TableCell>
                                <TableCell className="text-right"><Money value={totais.vICMS} /></TableCell>
                                <TableCell className="text-right"><Money value={totais.vIPI} /></TableCell>
                                <TableCell className="text-right"><Money value={totais.vPIS} /></TableCell>
                                <TableCell className="pr-4 text-right"><Money value={totais.vCOFINS} /></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
        </Card>
    );
}

