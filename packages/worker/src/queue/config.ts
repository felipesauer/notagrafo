import { Redis } from 'ioredis';

/** Nome da fila principal de processamento de NFe. */
export const NF_QUEUE = 'nf-processing';
/** Nome da dead-letter queue (jobs que esgotaram as tentativas). */
export const NF_DLQ = 'nf-processing-dlq';

/** Teto default de bytes de um XML de NF-e no enqueue (5 MiB). Uma NF-e real fica
 *  na casa de KB; 5 MiB é folga larga sem deixar payloads gigantes acumularem no
 *  Redis × concorrência. Configurável por MAX_XML_BYTES. */
export const DEFAULT_MAX_XML_BYTES = 5 * 1024 * 1024;

/** Opções de processamento derivadas do ambiente. */
export interface WorkerConfig {
    concurrency: number; // WORKER_CONCURRENCY
    maxRetries: number; // JOB_MAX_RETRIES
    backoffDelay: number; // JOB_BACKOFF_DELAY (ms)
    maxXmlBytes: number; // MAX_XML_BYTES — teto de tamanho do XML no enqueue
}

export function workerConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
    return {
        concurrency: Number(env.WORKER_CONCURRENCY ?? '4'),
        maxRetries: Number(env.JOB_MAX_RETRIES ?? '3'),
        backoffDelay: Number(env.JOB_BACKOFF_DELAY ?? '5000'),
        maxXmlBytes: Number(env.MAX_XML_BYTES ?? String(DEFAULT_MAX_XML_BYTES)),
    };
}

/** Cria a conexão Redis (BullMQ exige maxRetriesPerRequest: null). */
export function createRedisConnection(env: NodeJS.ProcessEnv = process.env): Redis {
    const url = env.REDIS_URL ?? 'redis://localhost:6379';
    return new Redis(url, { maxRetriesPerRequest: null });
}

/** Default job options: retries com backoff exponencial conforme env. */
export function defaultJobOptions(config: WorkerConfig) {
    return {
        attempts: config.maxRetries,
        backoff: { type: 'exponential' as const, delay: config.backoffDelay },
        removeOnComplete: { count: 1000 },
        removeOnFail: false, // mantém para inspeção / DLQ
    };
}
