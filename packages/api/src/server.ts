import { getDriver, runMigrations } from '@notagrafo/graph';
import { buildApp } from './app.js';

/** Boot da API: roda migrations, monta o app (com auth) e escuta na PORT. */
async function main(): Promise<void> {
    const driver = getDriver();
    await runMigrations(driver);
    const app = await buildApp({ logger: true, driver });
    const port = Number(process.env.PORT ?? '3000');
    await app.listen({ port, host: '0.0.0.0' });
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
    main().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[api] falha no boot:', err);
        process.exit(1);
    });
}

export { buildApp };
