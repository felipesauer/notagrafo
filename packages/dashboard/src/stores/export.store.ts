import { create } from 'zustand';

export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ExportJob {
    exportId: string;
    formato: string;
    status: ExportStatus;
    downloadUrl?: string;
}

interface ExportState {
    /** Job atualmente acompanhado pelo banner persistente. */
    jobAtivo: ExportJob | null;
    setJob: (job: ExportJob | null) => void;
    atualizarStatus: (status: ExportStatus, downloadUrl?: string) => void;
}

/** Store do export ativo — alimenta o ExportWatcher (polling + toast). */
export const useExportStore = create<ExportState>((set) => ({
    jobAtivo: null,
    setJob: (jobAtivo) => set({ jobAtivo }),
    atualizarStatus: (status, downloadUrl) =>
        set((s) => (s.jobAtivo ? { jobAtivo: { ...s.jobAtivo, status, ...(downloadUrl ? { downloadUrl } : {}) } } : s)),
}));
