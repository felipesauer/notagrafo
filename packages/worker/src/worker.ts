import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Driver } from 'neo4j-driver';
import { getDriver, runMigrations, closeDriver } from '@notagrafo/graph';
import { NF_QUEUE, createRedisConnection, workerConfigFromEnv } from './queue/config.js';
import { processNFe, type ProcessNFeJobData } from './jobs/process-nfe.job.js';
import { createXmlStorage } from './storage/factory.js';

/** Recursos abertos pelo worker que precisam ser liberados no shutdown. */
export interface WorkerHandle {
    worker: Worker<ProcessNFeJobData>;
    connection: Redis;
    driver: Driver;
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

    await runMigrations(driver);

    const worker = new Worker<ProcessNFeJobData>(
        NF_QUEUE,
        async (job) => processNFe(job.data, { driver, storage, onProgress: (pct) => job.updateProgress(pct) }),
        { connection, concurrency: config.concurrency },
    );

    worker.on('failed', (job, err) => {
        // Logger estruturado entra na task de observabilidade (Sprint 7).
        // eslint-disable-next-line no-console
        console.error(`[worker] job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message);
    });

    return { worker, connection, driver };
}

/**
 * Encerramento gracioso: para de aceitar novos jobs, aguarda o job em andamento
 * concluir (worker.close), e libera as conexões Redis e Neo4j. Idempotente.
 */
export async function shutdownWorker(handle: WorkerHandle): Promise<void> {
    // eslint-disable-next-line no-console
    console.error('[worker] shutdown iniciado — aguardando job ativo…');
    await handle.worker.close();
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
