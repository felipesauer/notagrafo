import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { NF_DLQ } from './config.js';
import type { ProcessNFeJobData } from '../jobs/process-nfe.job.js';

/** Payload de um job que esgotou as tentativas e foi para a dead-letter queue. */
export interface DeadLetterJobData {
    /** Payload original do job de processamento (para reprocessamento manual). */
    original: ProcessNFeJobData;
    /** Id do job original na fila principal (a chaveAcesso, normalmente). */
    jobId: string;
    /** Mensagem do erro que causou a última falha. */
    erro: string;
    /** Número de tentativas realizadas antes de desistir. */
    tentativas: number;
    /** Origem do upload, se conhecida (nome do arquivo/usuário). */
    origem?: string;
}

/** Cria a Queue BullMQ da dead-letter de NFe. */
export function createDLQ(connection: Redis): Queue<DeadLetterJobData> {
    return new Queue<DeadLetterJobData>(NF_DLQ, { connection });
}

/**
 * Move um job esgotado para a dead-letter queue: registra o payload original,
 * o erro e o número de tentativas para inspeção/reprocessamento posterior. Os
 * jobs da DLQ nunca são reprocessados automaticamente (attempts: 1).
 *
 * O jobId inclui o número de tentativas para que uma NFe que volte a ser
 * enviada e falhe de novo (nova rodada de tentativas) gere um registro NOVO na
 * DLQ, em vez de colidir com o anterior e ser ignorada silenciosamente pelo
 * BullMQ (dedupe por jobId).
 */
export async function moveToDeadLetter(dlq: Queue<DeadLetterJobData>, payload: DeadLetterJobData): Promise<void> {
    await dlq.add('dead-letter', payload, {
        jobId: `dlq:${payload.jobId}:${payload.tentativas}`,
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
    });
}
