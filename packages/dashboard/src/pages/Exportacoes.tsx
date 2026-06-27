import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/api.client.js';
import { NFStatusBadge, InlineError, EmptyState } from '../components/shared.js';
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

export function ExportacoesPage(): JSX.Element {
    const { t } = useTranslation();
    const setJob = useExportStore((s) => s.setJob);
    const [formato, setFormato] = useState<Formato>('csv');
    const [campos, setCampos] = useState<string[]>(CAMPOS);
    const [registros, setRegistros] = useState<ExportRegistro[]>([]);
    const [erro, setErro] = useState<string | null>(null);

    function alternarCampo(c: string): void {
        setCampos((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
    }

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
                    <select value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
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

            <section className="export-list">
                <h2>{t('exportacoes.historico')}</h2>
                {registros.length === 0 ? (
                    <EmptyState mensagem={t('exportacoes.vazio')} />
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>{t('exportacoes.formato')}</th><th>{t('nf.status')}</th><th>{t('exportacoes.acoes')}</th></tr>
                        </thead>
                        <tbody>
                            {registros.map((r) => (
                                <ExportRow key={r.exportId} registro={r} onUpdate={(atual) => setRegistros((rs) => rs.map((x) => (x.exportId === atual.exportId ? atual : x)))} />
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
    if (query.data && query.data.status !== registro.status) onUpdate({ ...registro, ...query.data });
    if (query.isError) return <tr><td colSpan={3}><InlineError onRetry={() => void query.refetch()} /></td></tr>;

    return (
        <tr>
            <td>{registro.formato.toUpperCase()}</td>
            <td><NFStatusBadge status={registro.status} /></td>
            <td>
                {registro.status === 'ready' && (
                    <a href={`/api/v1/export/${registro.exportId}/download`}>{t('exportacoes.baixar')}</a>
                )}
            </td>
        </tr>
    );
}
