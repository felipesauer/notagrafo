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
    const parsed = parseNFe(xml, new Date());
    const chaveAcesso = parsed.nota.chaveAcesso;

    const existente = await getInvoice(driver, chaveAcesso);
    if (existente) throw new NotaFiscalDuplicadaError(chaveAcesso);

    const config = opts?.config ?? workerConfigFromEnv();
    const job = await queue.add(
        'process-nfe',
        { xml, ...(opts?.origem ? { origem: opts.origem } : {}) },
        { jobId: chaveAcesso, ...defaultJobOptions(config) },
    );

    return { jobId: job.id ?? chaveAcesso, chaveAcesso };
}
