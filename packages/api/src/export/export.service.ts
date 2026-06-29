import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Driver } from 'neo4j-driver';
import { listInvoices, countInvoices, type NFFilters } from '@notagrafo/graph';

export type ExportFormato = 'csv' | 'xlsx' | 'json';
export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

/** Subconjunto de ioredis usado para persistir metadados de export (facilita teste). */
export interface RedisLike {
    set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<unknown>;
}

export interface ExportJob {
    exportId: string;
    formato: ExportFormato;
    status: ExportStatus;
    progresso: number; // registros já processados (estado processing)
    total: number; // total estimado de registros (estado processing)
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
 * Metadados em memória + Redis (quando disponível): sobrevivem a restart da API.
 * O arquivo gerado fica em disco local (por-nó). Single-node no MVP.
 */
export class ExportService {
    private readonly jobs = new Map<string, ExportJob>();
    private readonly dir = mkdtempSync(join(tmpdir(), 'nfp-exports-'));
    private readonly ttlMs: number;

    constructor(
        private readonly driver: Driver,
        ttlHours = Number(process.env.EXPORT_TTL_HOURS ?? '24'),
        /** Conexão Redis opcional: persiste os metadados do job (sobrevive a restart). */
        private readonly redis?: RedisLike,
    ) {
        this.ttlMs = ttlHours * 60 * 60 * 1000;
    }

    contentType(formato: ExportFormato): string {
        return CONTENT_TYPES[formato];
    }

    private redisKey(exportId: string): string {
        return `export:${exportId}`;
    }

    /** Grava os metadados do job no Redis com TTL (best-effort: erro não quebra o fluxo). */
    private async persistir(job: ExportJob): Promise<void> {
        if (!this.redis) return;
        try {
            const ttlSeg = Math.max(1, Math.ceil((job.expiresAt - Date.now()) / 1000));
            await this.redis.set(this.redisKey(job.exportId), JSON.stringify(job), 'EX', ttlSeg);
        } catch {
            // persistência é best-effort; o job segue em memória.
        }
    }

    /** Recupera os metadados do job do Redis (após restart, quando não está em memória). */
    private async doRedis(exportId: string): Promise<ExportJob | null> {
        if (!this.redis) return null;
        try {
            const raw = await this.redis.get(this.redisKey(exportId));
            return raw ? (JSON.parse(raw) as ExportJob) : null;
        } catch {
            return null;
        }
    }

    /** Cria o job e dispara a geração em background. Retorna o id imediatamente. */
    criar(formato: ExportFormato, filtros?: NFFilters, campos?: string[]): ExportJob {
        const exportId = `exp_${randomUUID().slice(0, 12)}`;
        const job: ExportJob = {
            exportId,
            formato,
            status: 'queued',
            progresso: 0,
            total: 0,
            totalRegistros: 0,
            tamanhoBytes: 0,
            expiresAt: Date.now() + this.ttlMs,
        };
        this.jobs.set(exportId, job);
        void this.persistir(job);
        void this.gerar(job, filtros, campos);
        return job;
    }

    /** Recupera o job (memória ou Redis após restart), expirando se passou do TTL. */
    async obter(exportId: string): Promise<ExportJob | 'expired' | null> {
        const job = this.jobs.get(exportId) ?? (await this.doRedis(exportId));
        if (!job) return null;
        if (job.status === 'ready' && Date.now() > job.expiresAt) {
            if (job.filePath) await rm(job.filePath, { force: true });
            this.jobs.delete(exportId);
            await this.redis?.del(this.redisKey(exportId)).catch(() => {});
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
        await this.persistir(job);
        try {
            // Total estimado para reportar progresso durante a geração (contrato §6).
            job.total = await countInvoices(this.driver, filtros ?? {});

            // Busca todas as NFs (paginando até o fim), atualizando o progresso.
            const linhas: Record<string, unknown>[] = [];
            let cursor: string | undefined;
            do {
                const page = await listInvoices(this.driver, filtros ?? {}, { limit: 200, ...(cursor ? { cursor } : {}) });
                linhas.push(...(page.data as unknown as Record<string, unknown>[]));
                job.progresso = linhas.length;
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
        await this.persistir(job);
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
