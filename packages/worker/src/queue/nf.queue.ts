import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Driver } from 'neo4j-driver';
import { parseNFe } from '@notagrafo/core';
import { getInvoice } from '@notagrafo/graph';
import { NF_QUEUE, defaultJobOptions, workerConfigFromEnv, type WorkerConfig } from './config.js';
import type { ProcessNFeJobData } from '../jobs/process-nfe.job.js';

/** Erro de duplicata: a chaveAcesso já existe no grafo (regra 1 → 409). */
export class NotaFiscalDuplicadaError extends Error {
    readonly chaveAcesso: string;
    constructor(chaveAcesso: string) {
        super(`NF com chave ${chaveAcesso} já existe.`);
        this.name = 'NotaFiscalDuplicadaError';
        this.chaveAcesso = chaveAcesso;
    }
}

/** Erro: o XML excede o teto de tamanho aceito no enqueue (→ 413 na API). */
export class XmlMuitoGrandeError extends Error {
    readonly bytes: number;
    readonly maxBytes: number;
    constructor(bytes: number, maxBytes: number) {
        super(`XML de ${bytes} bytes excede o limite de ${maxBytes} bytes (MAX_XML_BYTES).`);
        this.name = 'XmlMuitoGrandeError';
        this.bytes = bytes;
        this.maxBytes = maxBytes;
    }
}

export interface EnqueueResult {
    jobId: string;
    chaveAcesso: string;
}

/** Cria a Queue BullMQ de processamento de NFe. */
export function createNFQueue(connection: Redis): Queue<ProcessNFeJobData> {
    return new Queue<ProcessNFeJobData>(NF_QUEUE, { connection });
}

/**
 * Enfileira uma NFe para processamento, bloqueando duplicatas (regra 1):
 * extrai a chaveAcesso e rejeita se a NF já existe no grafo.
 *
 * @throws {NotaFiscalDuplicadaError} se a chave já estiver no grafo.
 */
export async function enqueueNFe(
    queue: Queue<ProcessNFeJobData>,
    driver: Driver,
    xml: string,
    opts?: { origem?: string; config?: WorkerConfig },
): Promise<EnqueueResult> {
    const config = opts?.config ?? workerConfigFromEnv();

    // Teto de tamanho ANTES de parsear/enfileirar: o XML cru vai no payload do job
    // (em Redis) e é mantido em memória (xml+gzip+json+parsed) durante o
    // processamento × concorrência. Rejeitar cedo evita acumular payloads gigantes
    // (NOTA-209). Byte length (não .length) porque o XML é UTF-8.
    const bytes = Buffer.byteLength(xml, 'utf8');
    if (bytes > config.maxXmlBytes) throw new XmlMuitoGrandeError(bytes, config.maxXmlBytes);

    const parsed = parseNFe(xml, new Date());
    const chaveAcesso = parsed.nota.chaveAcesso;

    const existente = await getInvoice(driver, chaveAcesso);
    if (existente) throw new NotaFiscalDuplicadaError(chaveAcesso);

    const job = await queue.add(
        'process-nfe',
        { xml, ...(opts?.origem ? { origem: opts.origem } : {}) },
        { jobId: chaveAcesso, ...defaultJobOptions(config) },
    );

    return { jobId: job.id ?? chaveAcesso, chaveAcesso };
}
