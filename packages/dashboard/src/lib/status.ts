/**
 * Fonte única das cores semânticas de status (NOTA-85 / NOTA-ADR-9 do redesign).
 *
 * Os valores são CSS vars definidas em styles/globals.css — respondem ao tema
 * claro/escuro automaticamente. Nenhum componente deve hard-codar hex de status.
 */

export type NFStatus = 'ativa' | 'cancelada' | 'denegada' | 'inutilizada';
export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

const NF_STATUS_COLOR: Record<NFStatus, string> = {
    ativa: 'var(--status-ativa)',
    cancelada: 'var(--status-cancelada)',
    denegada: 'var(--status-denegada)',
    inutilizada: 'var(--status-inutilizada)',
};

const EXPORT_STATUS_COLOR: Record<ExportStatus, string> = {
    queued: 'var(--export-pending)',
    processing: 'var(--export-processing)',
    ready: 'var(--export-ready)',
    failed: 'var(--export-failed)',
};

function isNFStatus(status: string): status is NFStatus {
    return status in NF_STATUS_COLOR;
}

function isExportStatus(status: string): status is ExportStatus {
    return status in EXPORT_STATUS_COLOR;
}

/**
 * Cor de um status de NF ou de exportação (o badge é compartilhado entre os
 * dois domínios). Status desconhecido cai no cinza de "inutilizada".
 */
export function statusColor(status: string): string {
    if (isNFStatus(status)) return NF_STATUS_COLOR[status];
    if (isExportStatus(status)) return EXPORT_STATUS_COLOR[status];
    return NF_STATUS_COLOR.inutilizada;
}

/**
 * Fundo tonal suave da pill de status (redesign BI vibrante, NOTA-ADR-13). O badge
 * passou de cor sólida + texto branco para pill (texto colorido sobre fundo tonal
 * + ícone). Os status de export mapeiam para o fundo do status de NF de mesma
 * semântica (queued→denegada/âmbar, processing→ativa? não: processing→azul via
 * inutilizada-bg neutro, ready→ativa, failed→cancelada). Desconhecido → cinza.
 */
const STATUS_BG: Record<string, string> = {
    ativa: 'var(--status-ativa-bg)',
    cancelada: 'var(--status-cancelada-bg)',
    denegada: 'var(--status-denegada-bg)',
    inutilizada: 'var(--status-inutilizada-bg)',
    ready: 'var(--status-ativa-bg)',
    failed: 'var(--status-cancelada-bg)',
    queued: 'var(--status-denegada-bg)',
    processing: 'var(--status-inutilizada-bg)',
};

export function statusBg(status: string): string {
    return STATUS_BG[status] ?? 'var(--status-inutilizada-bg)';
}
