import { type JSX, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, downloadFile } from '../api/api.client.js';
import { NFStatusBadge, InlineError, EmptyState, LoadingSkeleton } from '../components/shared.js';
import { useExportStore } from '../stores/export.store.js';

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

    // Hidrata o histórico ao montar (GET /export): sobrevive a reload/nova aba.
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

    // Estável (setRegistros é estável) — evita re-disparar o efeito de sync em ExportRow.
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
        <div className="exportacoes">
            <section className="export-form">
                <h2>{t('exportacoes.nova')}</h2>
                <label>
                    {t('exportacoes.formato')}
                    <select value={formato} onChange={(e) => setFormato(e.target.value as Formato)} data-testid="export-format">
                        <option value="csv">CSV</option>
                        <option value="xlsx">XLSX</option>
                        <option value="json">JSON</option>
                    </select>
                </label>
                <fieldset>
                    <legend>{t('exportacoes.campos')}</legend>
                    {CAMPOS.map((c) => (
                        <label key={c} className="checkbox">
                            <input type="checkbox" checked={campos.includes(c)} onChange={() => alternarCampo(c)} /> {c}
                        </label>
                    ))}
                </fieldset>
                {erro && <p className="login__erro">{erro}</p>}
                <button type="button" onClick={() => void gerar()}>{t('exportacoes.gerar')}</button>
            </section>

            <section className="export-list" data-testid="export-list">
                <h2>{t('exportacoes.historico')}</h2>
                {historico.isLoading ? (
                    <LoadingSkeleton linhas={3} />
                ) : historico.isError ? (
                    <InlineError onRetry={() => void historico.refetch()} />
                ) : registros.length === 0 ? (
                    <EmptyState mensagem={t('exportacoes.vazio')} />
                ) : (
                    <table className="data-table" data-testid="data-table">
                        <thead>
                            <tr><th>{t('exportacoes.formato')}</th><th>{t('nf.status')}</th><th>{t('exportacoes.acoes')}</th></tr>
                        </thead>
                        <tbody>
                            {registros.map((r) => (
                                <ExportRow key={r.exportId} registro={r} onUpdate={atualizarRegistro} />
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
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
    // Propaga a atualização de status ao pai via efeito (não durante o render).
    useEffect(() => {
        if (query.data && query.data.status !== registro.status) onUpdate({ ...registro, ...query.data });
    }, [query.data, registro, onUpdate]);
    if (query.isError) return <tr><td colSpan={3}><InlineError onRetry={() => void query.refetch()} /></td></tr>;

    return (
        <tr>
            <td>{registro.formato.toUpperCase()}</td>
            <td><NFStatusBadge status={registro.status} /></td>
            <td>
                {registro.status === 'ready' && (
                    <button type="button" className="link-icon" onClick={() => void downloadFile(`/export/${registro.exportId}/download`, `export-${registro.exportId}.${registro.formato}`)}>
                        {t('exportacoes.baixar')}
                    </button>
                )}
            </td>
        </tr>
    );
}
