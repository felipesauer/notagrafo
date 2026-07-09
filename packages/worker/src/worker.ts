import { Worker, type Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Driver } from 'neo4j-driver';
import { getDriver, runMigrations, closeDriver } from '@notagrafo/graph';
import { NF_QUEUE, createRedisConnection, workerConfigFromEnv } from './queue/config.js';
import { createDLQ, moveToDeadLetter, type DeadLetterJobData } from './queue/dlq.js';
import { processNFe, type ProcessNFeJobData } from './jobs/process-nfe.job.js';
import { createXmlStorage } from './storage/factory.js';

/** Chave Redis do heartbeat de liveness do worker (lida pelo healthcheck). */
export const WORKER_HEARTBEAT_KEY = 'worker:heartbeat';
/** Intervalo de escrita do heartbeat (ms). */
export const HEARTBEAT_INTERVAL_MS = 10_000;
/** TTL da chave de heartbeat (s): ~3 intervalos de folga antes de expirar. */
export const HEARTBEAT_TTL_SECONDS = 30;

/** Recursos abertos pelo worker que precisam ser liberados no shutdown. */
export interface WorkerHandle {
    worker: Worker<ProcessNFeJobData>;
    connection: Redis;
    driver: Driver;
    dlq: Queue<DeadLetterJobData>;
    /** Handlers `failed` em voo (DLQ/remove); aguardados antes de fechar conexões. */
    pendingFailures: Set<Promise<void>>;
    /** Timer do heartbeat de liveness (parado no shutdown). */
    heartbeat: ReturnType<typeof setInterval>;
}

/**
 * Escreve o heartbeat de liveness numa chave Redis com TTL. O healthcheck do
 * container lê essa chave: se o worker travar ou perder o Redis (de onde consome a
 * fila), a chave expira e o container fica unhealthy. É um probe honesto — valida
 * processo vivo E conexão Redis ativa, sem depender de porta HTTP (NOTA-210).
 */
export async function writeHeartbeat(connection: Redis): Promise<void> {
    // SET key <timestamp> EX <ttl>: renova o TTL a cada escrita.
    await connection.set(WORKER_HEARTBEAT_KEY, String(Date.now()), 'EX', HEARTBEAT_TTL_SECONDS);
}

/**
 * Boot do worker BullMQ: roda migrations do grafo e consome a fila de NFe
 * com a concorrência configurada. Cada job executa o pipeline processNFe.
 */
export async function startWorker(): Promise<WorkerHandle> {
    const config = workerConfigFromEnv();
    const connection = createRedisConnection();
    const driver = getDriver();
    const storage = createXmlStorage();
    const dlq = createDLQ(connection);

    await runMigrations(driver);

    const worker = new Worker<ProcessNFeJobData>(
        NF_QUEUE,
        async (job) => processNFe(job.data, { driver, storage, onProgress: (pct) => job.updateProgress(pct) }),
        { connection, concurrency: config.concurrency },
    );

    // O handler roda async fora do ciclo do worker.close(); rastreamos cada
    // promise para o shutdown poder aguardá-las antes de fechar dlq/conexões.
    const pendingFailures = new Set<Promise<void>>();
    worker.on('failed', (job, err) => {
        const p = handleFailedJob(dlq, config.maxRetries, job, err).finally(() => pendingFailures.delete(p));
        pendingFailures.add(p);
    });

    // Heartbeat de liveness: escreve já no boot e depois a cada intervalo. unref()
    // para o timer não impedir a saída do processo por si só.
    await writeHeartbeat(connection).catch(() => {});
    const heartbeat = setInterval(() => {
        void writeHeartbeat(connection).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[worker] falha ao escrever heartbeat:', (err as Error).message);
        });
    }, HEARTBEAT_INTERVAL_MS);
    heartbeat.unref();

    return { worker, connection, driver, dlq, pendingFailures, heartbeat };
}

/** Job BullMQ mínimo que o handler de falha precisa inspecionar/mover. */
export interface FailedJobLike {
    id?: string;
    data: ProcessNFeJobData;
    attemptsMade: number;
    remove: () => Promise<void>;
}

/**
 * Handler do evento `failed`: loga a falha e, quando o job ESGOTOU as tentativas
 * (attemptsMade >= maxRetries), move-o para a dead-letter queue e o remove da
 * fila principal — assim jobs mortos não ficam pendurados em `nf-processing`.
 * Falhas intermediárias (ainda haverá retry) só são logadas.
 */
export async function handleFailedJob(
    dlq: Queue<DeadLetterJobData>,
    maxRetries: number,
    job: FailedJobLike | undefined,
    err: Error,
): Promise<void> {
    // eslint-disable-next-line no-console
    console.error(`[worker] job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message);
    if (!job || job.attemptsMade < maxRetries) return;

    // 1) Grava na DLQ. Se falhar aqui, NÃO removemos da fila principal — o job
    //    fica como failed em nf-processing (removeOnFail:false), recuperável.
    try {
        await moveToDeadLetter(dlq, {
            original: job.data,
            jobId: job.id ?? 'desconhecido',
            erro: err.message,
            tentativas: job.attemptsMade,
            ...(job.data.origem ? { origem: job.data.origem } : {}),
        });
    } catch (dlqErr) {
        // eslint-disable-next-line no-console
        console.error(`[worker] falha ao gravar job ${job.id} na DLQ (mantido na fila principal):`, (dlqErr as Error).message);
        return;
    }

    // 2) DLQ ok → remove da fila principal. Se o remove falhar, o job fica nas
    //    DUAS filas; logamos como órfão para inspeção (não é perda de dado).
    try {
        await job.remove();
        // eslint-disable-next-line no-console
        console.error(`[worker] job ${job.id} movido para a DLQ após ${job.attemptsMade} tentativas.`);
    } catch (removeErr) {
        // eslint-disable-next-line no-console
        console.error(`[worker] job ${job.id} gravado na DLQ mas NÃO removido da fila principal (órfão):`, (removeErr as Error).message);
    }
}

/**
 * Encerramento gracioso: para de aceitar novos jobs, aguarda o job em andamento
 * concluir (worker.close), e libera as conexões Redis e Neo4j. Idempotente.
 */
export async function shutdownWorker(handle: WorkerHandle): Promise<void> {
    // eslint-disable-next-line no-console
    console.error('[worker] shutdown iniciado — aguardando job ativo…');
    // Para o heartbeat e apaga a chave: um shutdown gracioso não deve parecer vivo.
    clearInterval(handle.heartbeat);
    await handle.connection.del(WORKER_HEARTBEAT_KEY).catch(() => {});
    await handle.worker.close();
    // Aguarda os handlers `failed` disparados na parada (gravação na DLQ + remove)
    // ANTES de fechar a DLQ/conexão que eles usam.
    if (handle.pendingFailures.size > 0) {
        await Promise.allSettled([...handle.pendingFailures]);
    }
    await handle.dlq.close();
    await handle.connection.quit();
    await closeDriver();
    // eslint-disable-next-line no-console
    console.error('[worker] shutdown concluído.');
}

/**
 * Registra handlers de SIGTERM/SIGINT que disparam o shutdown gracioso. Um
 * segundo sinal força a saída imediata (evita travar num shutdown lento).
 */
export function registerShutdownHandlers(handle: WorkerHandle): void {
    let encerrando = false;
    const onSignal = (sinal: NodeJS.Signals): void => {
        if (encerrando) {
            // eslint-disable-next-line no-console
            console.error(`[worker] ${sinal} recebido novamente — saída forçada.`);
            process.exit(1);
        }
        encerrando = true;
        void shutdownWorker(handle)
            .then(() => process.exit(0))
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('[worker] erro no shutdown:', err);
                process.exit(1);
            });
    };
    // process.on (não once): o handler precisa continuar ativo para capturar um
    // segundo sinal e forçar a saída enquanto o shutdown gracioso está em curso.
    process.on('SIGTERM', onSignal);
    process.on('SIGINT', onSignal);
}

// Entry point quando executado diretamente (dist/worker.js).
if (process.argv[1] && /worker\.(js|ts)$/.test(process.argv[1])) {
    startWorker()
        .then((handle) => registerShutdownHandlers(handle))
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[worker] falha no boot:', err);
            process.exit(1);
        });
}
