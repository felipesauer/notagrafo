import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import type { Redis } from 'ioredis';
import { versoesSuportadas } from '@notagrafo/core';
import type { XmlStorage } from '@notagrafo/worker';

export interface HealthDeps {
    driver: Driver;
    redis: Redis;
    storage: XmlStorage;
}

type ServiceStatus = 'ok' | 'down';

async function checkNeo4j(driver: Driver): Promise<ServiceStatus> {
    const session = driver.session();
    try {
        await session.run('RETURN 1');
        return 'ok';
    } catch {
        return 'down';
    } finally {
        await session.close();
    }
}

async function checkRedis(redis: Redis): Promise<ServiceStatus> {
    try {
        return (await redis.ping()) === 'PONG' ? 'ok' : 'down';
    } catch {
        return 'down';
    }
}

async function checkStorage(storage: XmlStorage): Promise<ServiceStatus> {
    try {
        // exists em uma chave qualquer não deve lançar se o storage está acessível.
        await storage.exists('__healthcheck__');
        return 'ok';
    } catch {
        return 'down';
    }
}

const startedAt = Date.now();

/**
 * GET /health — SEM autenticação (regra: usada pelo Docker/orquestradores).
 * 200 quando tudo ok; 503 quando qualquer serviço está degradado.
 */
export async function healthRoutes(app: FastifyInstance, deps: HealthDeps): Promise<void> {
    app.get(
        '/health',
        { schema: { tags: ['health'], summary: 'Healthcheck (sem auth)' } },
        async (_request, reply) => {
            const [neo4j, redis, storage] = await Promise.all([
                checkNeo4j(deps.driver),
                checkRedis(deps.redis),
                checkStorage(deps.storage),
            ]);
            const services = { neo4j, redis, storage };
            const degraded = Object.values(services).some((s) => s !== 'ok');

            const body = {
                status: degraded ? 'degraded' : 'ok',
                services,
                xsdVersions: versoesSuportadas(),
                uptime: Math.floor((Date.now() - startedAt) / 1000),
            };
            reply.status(degraded ? 503 : 200).send(body);
        },
    );
}
