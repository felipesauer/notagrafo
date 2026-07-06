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
    private async persist(job: ExportJob): Promise<void> {
        if (!this.redis) return;
        try {
            const ttlSec = Math.max(1, Math.ceil((job.expiresAt - Date.now()) / 1000));
            await this.redis.set(this.redisKey(job.exportId), JSON.stringify(job), 'EX', ttlSec);
        } catch {
            // persistência é best-effort; o job segue em memória.
        }
    }

    /** Recupera os metadados do job do Redis (após restart, quando não está em memória). */
    private async readFromRedis(exportId: string): Promise<ExportJob | null> {
        if (!this.redis) return null;
        try {
            const raw = await this.redis.get(this.redisKey(exportId));
            return raw ? (JSON.parse(raw) as ExportJob) : null;
        } catch {
            return null;
        }
    }

    /** Cria o job e dispara a geração em background. Retorna o id imediatamente. */
    create(formato: ExportFormato, filters?: NFFilters, fields?: string[]): ExportJob {
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
        void this.persist(job);
        void this.generate(job, filters, fields);
        return job;
    }

    /** Recupera o job (memória ou Redis após restart), expirando se passou do TTL. */
    async get(exportId: string): Promise<ExportJob | 'expired' | null> {
        const emMemoria = this.jobs.get(exportId);
        const job = emMemoria ?? (await this.readFromRedis(exportId));
        if (!job) return null;

        // Job em andamento (queued/processing) recuperado do Redis SEM estar em
        // memória: a geração morreu num restart e nenhuma instância a retomará.
        // Transiciona para failed para o cliente não fazer polling eterno (ADR-5).
        if (!emMemoria && (job.status === 'processing' || job.status === 'queued')) {
            job.status = 'failed';
            job.erro = 'Geração interrompida por reinício do servidor.';
            this.jobs.set(exportId, job);
            await this.persist(job);
            return job;
        }

        if (job.status === 'ready' && Date.now() > job.expiresAt) {
            if (job.filePath) await rm(job.filePath, { force: true });
            this.jobs.delete(exportId);
            await this.redis?.del(this.redisKey(exportId)).catch(() => {});
            return 'expired';
        }
        return job;
    }

    /**
     * Lista os export jobs conhecidos por esta instância (mais recentes
     * primeiro), pulando os que já expiraram (ready além do TTL). Sobrevive ao
     * reload da página do browser enquanto o processo da API estiver no ar; o
     * arquivo/status por-id continua recuperável do Redis após restart (ADR-5).
     */
    list(): ExportJob[] {
        const agora = Date.now();
        return [...this.jobs.values()]
            .filter((j) => !(j.status === 'ready' && agora > j.expiresAt))
            .reverse();
    }

    /** Lê o conteúdo do arquivo gerado (para o download). */
    async read(job: ExportJob): Promise<Buffer> {
        if (!job.filePath) throw new Error('Export sem arquivo.');
        return readFile(job.filePath);
    }

    private async generate(job: ExportJob, filters?: NFFilters, fields?: string[]): Promise<void> {
        job.status = 'processing';
        await this.persist(job);
        try {
            // Total estimado para reportar progresso durante a geração (contrato §6).
            job.total = await countInvoices(this.driver, filters ?? {});

            // Busca todas as NFs (paginando até o fim), atualizando o progresso.
            const rows: Record<string, unknown>[] = [];
            let cursor: string | undefined;
            do {
                const page = await listInvoices(this.driver, filters ?? {}, { limit: 200, ...(cursor ? { cursor } : {}) });
                rows.push(...(page.data as unknown as Record<string, unknown>[]));
                job.progresso = rows.length;
                cursor = page.nextCursor ?? undefined;
            } while (cursor);

            // Achata as linhas (CNPJ do emitente/destinatário vêm aninhados em
            // listInvoices) para que TODOS os campos selecionáveis existam como
            // chave plana — senão cnpjEmitente/cnpjDestinatario saem vazios.
            const flatRows = rows.map(flattenRow);
            const content = this.serialize(job.formato, flatRows, fields);
            const filePath = join(this.dir, `${job.exportId}.${job.formato}`);
            await writeFile(filePath, content);

            job.filePath = filePath;
            job.totalRegistros = rows.length;
            job.tamanhoBytes = Buffer.byteLength(content);
            job.status = 'ready';
        } catch (err) {
            job.status = 'failed';
            job.erro = (err as Error).message;
        }
        await this.persist(job);
    }

    private serialize(formato: ExportFormato, rows: Record<string, unknown>[], fields?: string[]): string {
        const cols = fields ?? (rows[0] ? Object.keys(rows[0]) : []);
        if (formato === 'json') {
            return JSON.stringify(fields ? rows.map((l) => pick(l, cols)) : rows, null, 0);
        }
        // csv e xlsx: conteúdo tabular CSV. O ramo xlsx ainda não gera OOXML
        // nativo (melhoria futura), mas prefixa a diretiva `sep=,` + BOM UTF-8
        // para o Excel abrir em COLUNAS (não numa célula só) e com acentos
        // corretos — antes o "xlsx" era CSV cru e caía tudo numa coluna.
        const header = cols.join(',');
        const lines = rows.map((l) => cols.map((c) => csvCell(l[c])).join(','));
        const body = [header, ...lines].join('\r\n');
        // BOM (U+FEFF) = BOM UTF-8 (mantém acentos no Excel); "sep=," diz ao Excel o
        // separador, fazendo-o abrir em colunas em vez de tudo numa célula.
        if (formato === 'xlsx') return `\uFEFFsep=,\r\n${body}`;
        return body;
    }
}

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of keys) if (k in obj) out[k] = obj[k];
    return out;
}

/**
 * Achata uma linha de listInvoices num objeto de chaves planas exportáveis.
 * listInvoices devolve emitente/destinatário como objetos aninhados; os campos
 * selecionáveis no dashboard (cnpjEmitente, cnpjDestinatario, …) precisam existir
 * como chave de topo, senão a serialização os deixa vazios/ausentes. Preserva as
 * chaves planas já existentes (chaveAcesso, numero, dataEmissao, valorTotal, …).
 */
function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
    const emit = (row.emitente ?? undefined) as { cnpj?: string; razaoSocial?: string; uf?: string } | undefined;
    const dest = (row.destinatario ?? undefined) as { cnpj?: string; razaoSocial?: string; uf?: string } | undefined;
    return {
        ...row,
        cnpjEmitente: emit?.cnpj ?? '',
        razaoSocialEmitente: emit?.razaoSocial ?? '',
        ufEmitente: emit?.uf ?? '',
        cnpjDestinatario: dest?.cnpj ?? '',
        razaoSocialDestinatario: dest?.razaoSocial ?? '',
        ufDestinatario: dest?.uf ?? '',
    };
}

function csvCell(v: unknown): string {
    if (v === undefined || v === null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
