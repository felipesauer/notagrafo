import { type JSX, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, FileDown } from 'lucide-react';
import { apiFetch, downloadFile } from '../api/api.client.js';
import { NFStatusBadge, InlineError, EmptyState, LoadingSkeleton } from '../components/shared.js';
import { useExportStore } from '../stores/export.store.js';
import { useDensityStore, densityClass } from '../stores/density.store.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Label } from '../components/ui/label.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

/** KB/MB humano para o tamanho do arquivo de export. */
const fmtBytes = (b?: number): string => {
    if (!b) return '—';
    if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${b} B`;
};

type Formato = 'csv' | 'xlsx' | 'json';

interface ExportRegistro {
    exportId: string;
    formato: Formato;
    status: string;
    totalRegistros?: number;
    tamanhoBytes?: number;
    expiresAt?: string;
}

const CAMPOS = ['chaveAcesso', 'numero', 'dataEmissao', 'valorTotal', 'cnpjEmitente', 'cnpjDestinatario'];

export function ExportsPage(): JSX.Element {
    const { t } = useTranslation();
    const setJob = useExportStore((s) => s.setJob);
    const [formato, setFormato] = useState<Formato>('csv');
    const [campos, setCampos] = useState<string[]>(CAMPOS);
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

    const atualizarRegistro = useCallback((atual: ExportRegistro): void => {
        setRegistros((rs) => rs.map((x) => (x.exportId === atual.exportId ? atual : x)));
    }, []);

    async function gerar(): Promise<void> {
        setErro(null);
        try {
            const res = await apiFetch<{ exportId: string; status: string; formato: Formato }>('/export', {
                method: 'POST',
                body: { formato, campos },
            });
            const novo: ExportRegistro = { exportId: res.exportId, formato: res.formato, status: res.status };
            setRegistros((rs) => [novo, ...rs]);
            setJob({ exportId: res.exportId, formato: res.formato, status: 'queued' });
        } catch {
            setErro(t('comum.erro'));
        }
    }

    return (
        // preenche a altura disponível: o histórico (que cresce com dados) estica
        // até o rodapé em vez de deixar um vazio grande embaixo.
        <div className="flex min-h-full flex-col">
            {/* Header contextual leve (padrão das telas novas), não o h1 gigante. */}
            <div className="mb-4 flex items-center gap-2 border-b px-1 pb-3">
                <FileDown className="size-4 text-muted-foreground" />
                <div>
                    <h2 className="text-sm font-semibold leading-none tracking-tight">{t('sidebar.exportacoes')}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{t('exportacoes.subtitulo')}</p>
                </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
                <Card className="h-fit gap-4 py-4" data-testid="export-form">
                    <CardHeader className="px-4 pb-0"><CardTitle className="text-base">{t('exportacoes.nova')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4 px-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="export-formato" className="text-xs text-muted-foreground">{t('exportacoes.formato')}</Label>
                            <NativeSelect id="export-formato" data-testid="export-format" wrapperClassName="w-full" value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
                                <option value="csv">CSV</option>
                                <option value="xlsx">XLSX</option>
                                <option value="json">JSON</option>
                            </NativeSelect>
                        </div>
                        <fieldset className="grid gap-1.5">
                            <legend className="mb-1 text-xs text-muted-foreground">{t('exportacoes.campos')}</legend>
                            {CAMPOS.map((c) => (
                                <Label key={c} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-muted/50">
                                    <Checkbox checked={campos.includes(c)} onCheckedChange={() => alternarCampo(c)} />
                                    <span>{t(`exportacoes.campo.${c}`, { defaultValue: c })}</span>
                                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">{c}</span>
                                </Label>
                            ))}
                        </fieldset>
                        {erro && <p className="text-sm text-destructive">{erro}</p>}
                        <Button type="button" className="w-full" disabled={campos.length === 0} onClick={() => void gerar()}>
                            <FileDown /> {t('exportacoes.gerar')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col overflow-hidden py-0" data-testid="export-list">
                    <CardHeader className="border-b px-4 py-3"><CardTitle className="text-base">{t('exportacoes.historico')}</CardTitle></CardHeader>
                    <CardContent className="flex-1 px-0 pb-0">
                        {historico.isLoading ? (
                            <div className="p-4"><LoadingSkeleton variant="table" linhas={3} colunas={4} /></div>
                        ) : historico.isError ? (
                            <div className="p-4"><InlineError onRetry={() => void historico.refetch()} /></div>
                        ) : registros.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    mensagem={t('exportacoes.vazio')}
                                    action={<Button type="button" variant="outline" size="sm" onClick={() => void gerar()}><FileDown /> {t('exportacoes.primeira')}</Button>}
                                />
                            </div>
                        ) : (
                            <Table data-testid="data-table" className={densityClass(density)}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('exportacoes.formato')}</TableHead>
                                        <TableHead>{t('nf.status')}</TableHead>
                                        <TableHead className="text-right">{t('exportacoes.registros')}</TableHead>
                                        <TableHead className="text-right">{t('exportacoes.tamanho')}</TableHead>
                                        <TableHead className="text-right">{t('exportacoes.acoes')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registros.map((r) => (
                                        <ExportRow key={r.exportId} registro={r} onUpdate={atualizarRegistro} />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
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

    function baixar(): void {
        void downloadFile(`/export/${registro.exportId}/download`, `export-${registro.exportId}.${registro.formato}`)
            .then(() => toast.success(t('exportacoes.baixar')));
    }

    return (
        <TableRow>
            <TableCell className="font-medium">{registro.formato.toUpperCase()}</TableCell>
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
