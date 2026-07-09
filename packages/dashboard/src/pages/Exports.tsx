import { type JSX, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, FileDown } from 'lucide-react';
import { apiFetch, downloadFile } from '../api/api.client.js';
import { NFStatusBadge, InlineError, EmptyState, LoadingSkeleton } from '../components/shared.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { PageHeader } from '../components/PageHeader.js';
import { useExportStore } from '../stores/export.store.js';
import { useDensityStore, densityClass } from '../stores/density.store.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion.js';
import { Label } from '../components/ui/label.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { SortableHead } from '../components/SortableHead.js';
import { TablePagination } from '../components/TablePagination.js';
import { useClientTable } from '../hooks/useClientTable.js';
import { type Density } from '../stores/density.store.js';
import { type TFunction } from 'i18next';

/** KB/MB humano para o tamanho do arquivo de export. */
const fmtBytes = (b?: number): string => {
    if (!b) return '—';
    if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${b} B`;
};

type Formato = 'csv' | 'xlsx' | 'json';
type ExportTipo = 'nf' | 'rede';

interface ExportRegistro {
    exportId: string;
    formato: Formato;
    status: string;
    totalRegistros?: number;
    tamanhoBytes?: number;
    expiresAt?: string;
    /** Quando true, o download é um .zip com dados + XMLs originais (NOTA-198). */
    incluirXml?: boolean;
    /** 'nf' (padrão) ou 'rede' — nós+arestas da rede de relações (NOTA-199). */
    tipo?: ExportTipo;
}

/**
 * Campos exportáveis, agrupados por afinidade. Todos são chaves planas que o
 * backend já produz (listInvoices + flattenRow em export.service): identificação e
 * datas vêm diretas do nó NotaFiscal; as de emitente/destinatário são achatadas
 * de objetos aninhados. O `id` é a chave enviada à API em `campos`.
 */
interface CampoDef { id: string; grupoKey: string }
const GRUPOS: { key: string; campos: string[] }[] = [
    { key: 'identificacao', campos: ['chaveAcesso', 'numero', 'serie', 'status', 'tipoNF', 'finalidade', 'naturezaOp'] },
    { key: 'valores', campos: ['valorTotal'] },
    { key: 'datas', campos: ['dataEmissao', 'dataSaida', 'importadaEm', 'processadaEm'] },
    { key: 'emitente', campos: ['cnpjEmitente', 'razaoSocialEmitente', 'ufEmitente'] },
    { key: 'destinatario', campos: ['cnpjDestinatario', 'razaoSocialDestinatario', 'ufDestinatario'] },
    // Tributos (totais da NF) — inclui a Reforma (IBS/CBS/IS). EPIC-25.
    { key: 'tributos', campos: ['vICMS', 'vICMSST', 'vIPI', 'vPIS', 'vCOFINS', 'vFCP', 'vIBS', 'vIBSUF', 'vIBSMun', 'vCBS', 'vIS'] },
];
const CAMPOS: CampoDef[] = GRUPOS.flatMap((g) => g.campos.map((id) => ({ id, grupoKey: g.key })));
const TODOS_CAMPOS = CAMPOS.map((c) => c.id);
// Seleção inicial: os 6 campos "essenciais" que já eram o padrão histórico.
const CAMPOS_PADRAO = ['chaveAcesso', 'numero', 'dataEmissao', 'valorTotal', 'cnpjEmitente', 'cnpjDestinatario'];

export function ExportsPage(): JSX.Element {
    const { t } = useTranslation();
    const setJob = useExportStore((s) => s.setJob);
    const [tipo, setTipo] = useState<ExportTipo>('nf');
    const [formato, setFormato] = useState<Formato>('csv');
    const [campos, setCampos] = useState<string[]>(CAMPOS_PADRAO);
    const [incluirXml, setIncluirXml] = useState(false);
    const isRede = tipo === 'rede';
    const [registros, setRegistros] = useState<ExportRegistro[]>([]);
    const [erro, setErro] = useState<string | null>(null);
    const density = useDensityStore((s) => s.density);

    const historico = useQuery({
        queryKey: ['export', 'list'],
        queryFn: () => apiFetch<{ data: ExportRegistro[] }>('/export'),
    });
    useEffect(() => {
        if (historico.data) setRegistros(historico.data.data);
    }, [historico.data]);

    function alternarCampo(c: string): void {
        setCampos((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
    }
    /** Marca/desmarca todos os campos de um grupo de uma vez. */
    function alternarGrupo(campos: string[], marcar: boolean): void {
        setCampos((cs) => (marcar ? [...new Set([...cs, ...campos])] : cs.filter((c) => !campos.includes(c))));
    }
    const todosMarcados = campos.length === TODOS_CAMPOS.length;

    const atualizarRegistro = useCallback((atual: ExportRegistro): void => {
        setRegistros((rs) => rs.map((x) => (x.exportId === atual.exportId ? atual : x)));
    }, []);

    async function gerar(): Promise<void> {
        setErro(null);
        try {
            const res = await apiFetch<{ exportId: string; status: string; formato: Formato; incluirXml: boolean; tipo: ExportTipo }>('/export', {
                method: 'POST',
                body: isRede ? { formato: 'json', tipo } : { formato, campos, incluirXml, tipo },
            });
            const novo: ExportRegistro = { exportId: res.exportId, formato: res.formato, status: res.status, incluirXml: res.incluirXml, tipo: res.tipo };
            setRegistros((rs) => [novo, ...rs]);
            setJob({ exportId: res.exportId, formato: res.formato, status: 'queued' });
        } catch {
            setErro(t('comum.erro'));
        }
    }

    return (
        <PageContainer width="wide">
            <PageHeader
                title={t('sidebar.exportacoes')}
                description={t('exportacoes.subtitulo')}
                icon={FileDown}
            />
            {/* Form no topo (horizontal): formato + ação numa linha, campos em
                accordion por grupo lado a lado — evita a coluna estreita de ~30
                checkboxes empilhados. Histórico abaixo, em largura total (NOTA-197). */}
            <div className="flex flex-col gap-4">
                <Card className="gap-4 py-4" data-testid="export-form">
                    <CardHeader className="flex flex-col gap-3 px-4 pb-0 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-1.5">
                            <CardTitle className="text-base">{t('exportacoes.nova')}</CardTitle>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="export-tipo" className="text-xs text-muted-foreground">{t('exportacoes.tipo')}</Label>
                                    <NativeSelect id="export-tipo" data-testid="export-tipo" wrapperClassName="w-36" value={tipo} onChange={(e) => setTipo(e.target.value as ExportTipo)}>
                                        <option value="nf">{t('exportacoes.tipoNf')}</option>
                                        <option value="rede">{t('exportacoes.tipoRede')}</option>
                                    </NativeSelect>
                                </div>
                                {!isRede && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="export-formato" className="text-xs text-muted-foreground">{t('exportacoes.formato')}</Label>
                                            <NativeSelect id="export-formato" data-testid="export-format" wrapperClassName="w-32" value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
                                                <option value="csv">CSV</option>
                                                <option value="xlsx">XLSX</option>
                                                <option value="json">JSON</option>
                                            </NativeSelect>
                                        </div>
                                        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                                            <Checkbox checked={incluirXml} onCheckedChange={(v) => setIncluirXml(v === true)} data-testid="export-incluir-xml" />
                                            {t('exportacoes.incluirXml')}
                                        </Label>
                                    </>
                                )}
                            </div>
                        </div>
                        <Button type="button" disabled={!isRede && campos.length === 0} onClick={() => void gerar()}>
                            <FileDown /> {t('exportacoes.gerar')}
                        </Button>
                    </CardHeader>
                    {isRede ? (
                        <CardContent className="px-4">
                            <p className="text-sm text-muted-foreground">{t('exportacoes.tipoRedeAjuda')}</p>
                            {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
                        </CardContent>
                    ) : (
                    <CardContent className="px-4">
                        <fieldset className="grid gap-3">
                            <div className="flex items-center justify-between">
                                <legend className="text-xs text-muted-foreground">
                                    {t('exportacoes.campos')} <span className="tabular-nums">({campos.length}/{TODOS_CAMPOS.length})</span>
                                </legend>
                                <button
                                    type="button"
                                    className="text-xs font-medium text-primary hover:underline"
                                    onClick={() => setCampos(todosMarcados ? [] : [...TODOS_CAMPOS])}
                                >
                                    {t(todosMarcados ? 'exportacoes.limparTodos' : 'exportacoes.todos')}
                                </button>
                            </div>
                            <Accordion type="multiple" defaultValue={GRUPOS.map((g) => g.key)} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                {GRUPOS.map((g) => {
                                    const marcadosNoGrupo = g.campos.filter((c) => campos.includes(c)).length;
                                    const grupoCheio = marcadosNoGrupo === g.campos.length;
                                    return (
                                        <AccordionItem key={g.key} value={g.key} className="rounded-lg border px-3">
                                            <AccordionTrigger className="py-2.5 hover:no-underline">
                                                <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {t(`exportacoes.grupo.${g.key}`)}
                                                    <span className="rounded-full bg-muted px-1.5 py-0 font-mono text-3xs tabular-nums text-foreground">{marcadosNoGrupo}/{g.campos.length}</span>
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="flex flex-col gap-0.5 pb-2">
                                                <button
                                                    type="button"
                                                    className="mb-1 self-start text-3xs text-muted-foreground hover:text-foreground hover:underline"
                                                    onClick={() => alternarGrupo(g.campos, !grupoCheio)}
                                                >
                                                    {t(grupoCheio ? 'exportacoes.limparTodos' : 'exportacoes.todos')}
                                                </button>
                                                {g.campos.map((c) => (
                                                    <Label key={c} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-normal hover:bg-muted/50">
                                                        <Checkbox checked={campos.includes(c)} onCheckedChange={() => alternarCampo(c)} />
                                                        <span className="truncate">{t(`exportacoes.campo.${c}`, { defaultValue: c })}</span>
                                                    </Label>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </fieldset>
                        {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
                    </CardContent>
                    )}
                </Card>

                <Card className="overflow-hidden py-0" data-testid="export-list">
                    <CardHeader className="border-b px-4 py-3"><CardTitle className="text-base">{t('exportacoes.historico')}</CardTitle></CardHeader>
                    <CardContent className="px-0 pb-0">
                        {historico.isLoading ? (
                            <div className="p-4"><LoadingSkeleton variant="table" linhas={3} colunas={4} /></div>
                        ) : historico.isError ? (
                            <div className="p-4"><InlineError onRetry={() => void historico.refetch()} /></div>
                        ) : registros.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={FileDown}
                                    titulo={t('exportacoes.vazio')}
                                    descricao={t('exportacoes.vazioDescricao')}
                                    action={<Button type="button" variant="outline" size="sm" onClick={() => void gerar()}><FileDown /> {t('exportacoes.primeira')}</Button>}
                                />
                            </div>
                        ) : (
                            <HistoricoTable registros={registros} density={density} onUpdate={atualizarRegistro} t={t} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}

/** Linha da lista: faz polling de 10s enquanto pendente; download quando ready. */
function ExportRow({ registro, onUpdate }: { registro: ExportRegistro; onUpdate: (r: ExportRegistro) => void }): JSX.Element {
    const { t } = useTranslation();
    const pendente = registro.status === 'queued' || registro.status === 'processing';
    const query = useQuery({
        queryKey: ['export', registro.exportId],
        queryFn: () => apiFetch<ExportRegistro>(`/export/${registro.exportId}`),
        refetchInterval: pendente ? 10_000 : false,
        enabled: pendente,
    });
    useEffect(() => {
        if (query.data && query.data.status !== registro.status) onUpdate({ ...registro, ...query.data });
    }, [query.data, registro, onUpdate]);
    if (query.isError) return <TableRow><TableCell colSpan={5}><InlineError onRetry={() => void query.refetch()} /></TableCell></TableRow>;

    const ext = registro.incluirXml ? 'zip' : registro.formato;

    function baixar(): void {
        void downloadFile(`/export/${registro.exportId}/download`, `export-${registro.exportId}.${ext}`)
            .then(() => toast.success(t('exportacoes.baixar')));
    }

    return (
        <TableRow>
            <TableCell className="font-medium">
                {registro.formato.toUpperCase()}
                {registro.tipo === 'rede' && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0 text-3xs font-semibold text-primary">{t('exportacoes.tipoRede')}</span>}
                {registro.incluirXml && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0 text-3xs font-semibold text-muted-foreground">+XML</span>}
            </TableCell>
            <TableCell><NFStatusBadge status={registro.status} /></TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{registro.totalRegistros ?? '—'}</TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{fmtBytes(registro.tamanhoBytes)}</TableCell>
            <TableCell className="text-right">
                {registro.status === 'ready' && (
                    <Button type="button" variant="ghost" size="sm" onClick={baixar}>
                        <Download /> {t('exportacoes.baixar')}
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}

/** Histórico de exports — ordenável (formato/status/registros/tamanho) + paginação client. */
function HistoricoTable({ registros, density, onUpdate, t }: { registros: ExportRegistro[]; density: Density; onUpdate: (r: ExportRegistro) => void; t: TFunction }): JSX.Element {
    const { pageRows, toggle, ariaSort, pagination } = useClientTable(registros, {
        formato: (r) => r.formato,
        status: (r) => r.status,
        totalRegistros: (r) => r.totalRegistros ?? 0,
        tamanhoBytes: (r) => r.tamanhoBytes ?? 0,
    }, { initialPageSize: 10 });
    return (
        <>
            <Table data-testid="data-table" data-zebra className={densityClass(density)}>
                <TableHeader>
                    <TableRow>
                        <SortableHead sortKey="formato" ariaSort={ariaSort} onToggle={toggle}>{t('exportacoes.formato')}</SortableHead>
                        <SortableHead sortKey="status" ariaSort={ariaSort} onToggle={toggle}>{t('nf.status')}</SortableHead>
                        <SortableHead sortKey="totalRegistros" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('exportacoes.registros')}</SortableHead>
                        <SortableHead sortKey="tamanhoBytes" ariaSort={ariaSort} onToggle={toggle} align="right" className="text-right">{t('exportacoes.tamanho')}</SortableHead>
                        <TableHead className="text-right">{t('exportacoes.acoes')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageRows.map((r) => (
                        <ExportRow key={r.exportId} registro={r} onUpdate={onUpdate} />
                    ))}
                </TableBody>
            </Table>
            <TablePagination {...pagination} />
        </>
    );
}
