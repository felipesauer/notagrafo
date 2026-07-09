import { createRedisConnection } from './queue/config.js';
import { WORKER_HEARTBEAT_KEY, HEARTBEAT_TTL_SECONDS } from './worker.js';

/**
 * Healthcheck do container do worker (docker-compose): lê a chave de heartbeat no
 * Redis e sai 0 (healthy) se ela existe e é recente, 1 (unhealthy) caso contrário.
 * Roda com `node dist/healthcheck.js` — a imagem alpine não tem redis-cli, mas tem
 * node + ioredis (dep do worker). Honesto: valida processo vivo E conexão Redis
 * (o worker só escreve o heartbeat enquanto vivo e conectado). Ver NOTA-210.
 */
async function main(): Promise<void> {
    const connection = createRedisConnection();
    try {
        const raw = await connection.get(WORKER_HEARTBEAT_KEY);
        if (!raw) {
            // eslint-disable-next-line no-console
            console.error('[healthcheck] heartbeat ausente — worker não está vivo.');
            process.exitCode = 1;
            return;
        }
        const idadeMs = Date.now() - Number(raw);
        // Folga: a chave já tem TTL no Redis; aqui só reforçamos que não está velha.
        if (Number.isNaN(idadeMs) || idadeMs > HEARTBEAT_TTL_SECONDS * 1000) {
            // eslint-disable-next-line no-console
            console.error(`[healthcheck] heartbeat velho (${idadeMs}ms) — worker travado?`);
            process.exitCode = 1;
            return;
        }
        process.exitCode = 0;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[healthcheck] falha ao ler o heartbeat no Redis:', (err as Error).message);
        process.exitCode = 1;
    } finally {
        await connection.quit().catch(() => {});
    }
}

void main();
