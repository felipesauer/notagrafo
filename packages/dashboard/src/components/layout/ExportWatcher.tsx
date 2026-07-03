import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiFetch, downloadFile } from '../../api/api.client.js';
import { useExportStore, type ExportStatus } from '../../stores/export.store.js';

interface ExportStatusResponse {
    status: ExportStatus;
    downloadUrl?: string;
}

const POLL_MS = 10_000;

/**
 * Componente headless montado no shell. Faz polling do job de exportação ativo
 * (10s) enquanto pendente e, quando fica `ready`, dispara um toast persistente
 * com ação "Baixar". Substitui o antigo ExportBanner. O toast usa `id` estável
 * (o exportId) para não duplicar sob o StrictMode / re-render.
 */
export function ExportWatcher(): null {
    const { t } = useTranslation();
    const jobAtivo = useExportStore((s) => s.jobAtivo);
    const atualizarStatus = useExportStore((s) => s.atualizarStatus);
    const setJob = useExportStore((s) => s.setJob);

    // Polling enquanto o job está pendente.
    useEffect(() => {
        if (!jobAtivo || jobAtivo.status === 'ready' || jobAtivo.status === 'failed') return;
        const id = setInterval(() => {
            void apiFetch<ExportStatusResponse>(`/export/${jobAtivo.exportId}`)
                .then((res) => atualizarStatus(res.status, res.downloadUrl))
                .catch(() => {});
        }, POLL_MS);
        return () => clearInterval(id);
    }, [jobAtivo, atualizarStatus]);

    // Toast quando o job fica pronto.
    useEffect(() => {
        if (!jobAtivo || jobAtivo.status !== 'ready') return;
        const { exportId, formato } = jobAtivo;
        toast.success(t('export.pronta'), {
            id: `export-${exportId}`,
            duration: Infinity,
            action: {
                label: t('export.baixar'),
                onClick: () =>
                    void downloadFile(`/export/${exportId}/download`, `export-${exportId}.${formato}`),
            },
            onDismiss: () => setJob(null),
        });
    }, [jobAtivo, t, setJob]);

    return null;
}
