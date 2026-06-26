import { Worker } from 'bullmq';
import { getDriver, runMigrations } from '@notagrafo/graph';
import { NF_QUEUE, createRedisConnection, workerConfigFromEnv } from './queue/config.js';
import { processNFe, type ProcessNFeJobData } from './jobs/process-nfe.job.js';
import { createXmlStorage } from './storage/factory.js';

/**
 * Boot do worker BullMQ: roda migrations do grafo e consome a fila de NFe
 * com a concorrência configurada. Cada job executa o pipeline processNFe.
 */
export async function startWorker(): Promise<Worker<ProcessNFeJobData>> {
    const config = workerConfigFromEnv();
    const connection = createRedisConnection();
    const driver = getDriver();
    const storage = createXmlStorage();

    await runMigrations(driver);

    const worker = new Worker<ProcessNFeJobData>(
        NF_QUEUE,
        async (job) => processNFe(job.data, { driver, storage }),
        { connection, concurrency: config.concurrency },
    );

    worker.on('failed', (job, err) => {
        // Logger estruturado entra na task de observabilidade (Sprint 7).
        // eslint-disable-next-line no-console
        console.error(`[worker] job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message);
    });

    return worker;
}

// Entry point quando executado diretamente (dist/worker.js).
if (process.argv[1] && process.argv[1].endsWith('worker.js')) {
    startWorker().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[worker] falha no boot:', err);
        process.exit(1);
    });
}
