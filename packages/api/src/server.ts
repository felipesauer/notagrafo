import { getDriver, runMigrations } from '@notagrafo/graph';
import { createNFQueue, createRedisConnection, createXmlStorage } from '@notagrafo/worker';
import { startTelemetry } from './observability/telemetry.js';
import { buildApp } from './app.js';

/** Boot da API: telemetria ANTES do Fastify, migrations, app e listen na PORT. */
async function main(): Promise<void> {
    startTelemetry(); // OTel deve iniciar antes de montar o Fastify
    const driver = getDriver();
    await runMigrations(driver);
    const redis = createRedisConnection();
    const queue = createNFQueue(redis);
    const storage = createXmlStorage();
    const app = await buildApp({ logger: true, driver, queue, storage, redis });
    const port = Number(process.env.PORT ?? '3000');
    await app.listen({ port, host: '0.0.0.0' });
}

if (process.argv[1] && /server\.(js|ts)$/.test(process.argv[1])) {
    main().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[api] falha no boot:', err);
        process.exit(1);
    });
}

export { buildApp };
