import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/api.client.js';
import { useExportStore, type ExportStatus } from '../stores/export.store.js';

interface ExportStatusResponse {
    status: ExportStatus;
    downloadUrl?: string;
}

const POLL_MS = 10_000;

/**
 * Banner persistente de exportação pronta. Faz polling a cada 10s enquanto o
 * job está pendente; quando fica ready, mostra o link de download. Persiste
 * entre navegações (estado no store) até ser dispensado.
 */
export function ExportBanner(): JSX.Element | null {
    const { t } = useTranslation();
    const jobAtivo = useExportStore((s) => s.jobAtivo);
    const atualizarStatus = useExportStore((s) => s.atualizarStatus);
    const setJob = useExportStore((s) => s.setJob);
    const [dispensado, setDispensado] = useState(false);

    useEffect(() => {
        if (!jobAtivo || jobAtivo.status === 'ready' || jobAtivo.status === 'failed') return;
        const id = setInterval(() => {
            void apiFetch<ExportStatusResponse>(`/export/${jobAtivo.exportId}`)
                .then((res) => atualizarStatus(res.status, res.downloadUrl))
                .catch(() => {});
        }, POLL_MS);
        return () => clearInterval(id);
    }, [jobAtivo, atualizarStatus]);

    if (!jobAtivo || jobAtivo.status !== 'ready' || dispensado) return null;

    return (
        <div className="export-banner" role="status">
            <span>{t('export.pronta')}</span>
            <a href={jobAtivo.downloadUrl ?? `/api/v1/export/${jobAtivo.exportId}/download`}>{t('export.baixar')}</a>
            <button type="button" aria-label={t('export.fechar')} onClick={() => { setDispensado(true); setJob(null); }}>
                ✕
            </button>
        </div>
    );
}
