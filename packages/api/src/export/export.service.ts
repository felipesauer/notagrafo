import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Driver } from 'neo4j-driver';
import { listNotasFiscais, type NFFilters } from '@notagrafo/graph';

export type ExportFormato = 'csv' | 'xlsx' | 'json';
export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ExportJob {
    exportId: string;
    formato: ExportFormato;
    status: ExportStatus;
    totalRegistros: number;
    tamanhoBytes: number;
    expiresAt: number; // epoch ms
    filePath?: string;
    erro?: string;
}

const CONTENT_TYPES: Record<ExportFormato, string> = {
    csv: 'text/csv',
    json: 'application/json',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Gerência de exportações assíncronas, com arquivos em disco e TTL.
 * Em memória por instância — suficiente para o MVP (single-node) e testável.
 */
export class ExportService {
    private readonly jobs = new Map<string, ExportJob>();
    private readonly dir = mkdtempSync(join(tmpdir(), 'nfp-exports-'));
    private readonly ttlMs: number;

    constructor(
        private readonly driver: Driver,
        ttlHours = Number(process.env.EXPORT_TTL_HOURS ?? '24'),
    ) {
        this.ttlMs = ttlHours * 60 * 60 * 1000;
    }

    contentType(formato: ExportFormato): string {
        return CONTENT_TYPES[formato];
    }

    /** Cria o job e dispara a geração em background. Retorna o id imediatamente. */
    criar(formato: ExportFormato, filtros?: NFFilters, campos?: string[]): ExportJob {
        const exportId = `exp_${randomUUID().slice(0, 12)}`;
        const job: ExportJob = {
            exportId,
            formato,
            status: 'queued',
            totalRegistros: 0,
            tamanhoBytes: 0,
            expiresAt: Date.now() + this.ttlMs,
        };
        this.jobs.set(exportId, job);
        void this.gerar(job, filtros, campos);
        return job;
    }

    /** Recupera o job, marcando como expirado (removendo o arquivo) se passou do TTL. */
    async obter(exportId: string): Promise<ExportJob | 'expired' | null> {
        const job = this.jobs.get(exportId);
        if (!job) return null;
        if (job.status === 'ready' && Date.now() > job.expiresAt) {
            if (job.filePath) await rm(job.filePath, { force: true });
            this.jobs.delete(exportId);
            return 'expired';
        }
        return job;
    }

    /** Lê o conteúdo do arquivo gerado (para o download). */
    async ler(job: ExportJob): Promise<Buffer> {
        if (!job.filePath) throw new Error('Export sem arquivo.');
        return readFile(job.filePath);
    }

    private async gerar(job: ExportJob, filtros?: NFFilters, campos?: string[]): Promise<void> {
        job.status = 'processing';
        try {
            // Busca todas as NFs (paginando até o fim).
            const linhas: Record<string, unknown>[] = [];
            let cursor: string | undefined;
            do {
                const page = await listNotasFiscais(this.driver, filtros ?? {}, { limit: 200, ...(cursor ? { cursor } : {}) });
                linhas.push(...(page.data as unknown as Record<string, unknown>[]));
                cursor = page.nextCursor ?? undefined;
            } while (cursor);

            const conteudo = this.serializar(job.formato, linhas, campos);
            const filePath = join(this.dir, `${job.exportId}.${job.formato}`);
            await writeFile(filePath, conteudo);

            job.filePath = filePath;
            job.totalRegistros = linhas.length;
            job.tamanhoBytes = Buffer.byteLength(conteudo);
            job.status = 'ready';
        } catch (err) {
            job.status = 'failed';
            job.erro = (err as Error).message;
        }
    }

    private serializar(formato: ExportFormato, linhas: Record<string, unknown>[], campos?: string[]): string {
        const cols = campos ?? (linhas[0] ? Object.keys(linhas[0]) : []);
        if (formato === 'json') {
            return JSON.stringify(campos ? linhas.map((l) => pick(l, cols)) : linhas, null, 0);
        }
        // csv e xlsx (xlsx servido como CSV no MVP — mesmo conteúdo tabular)
        const header = cols.join(',');
        const rows = linhas.map((l) => cols.map((c) => csvCell(l[c])).join(','));
        return [header, ...rows].join('\n');
    }
}

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of keys) if (k in obj) out[k] = obj[k];
    return out;
}

function csvCell(v: unknown): string {
    if (v === undefined || v === null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
