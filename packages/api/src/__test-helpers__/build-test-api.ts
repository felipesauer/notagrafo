import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from '../errors.js';

/**
 * App Fastify mínima para testar rotas isoladamente (sem Testcontainers):
 * error handler padrão + `authenticate` no-op (injeta um user fake) + multipart.
 * O `register` recebe a app já com o decorator pronto para registrar as rotas alvo.
 */
export async function buildTestApi(register: (app: FastifyInstance) => Promise<void>): Promise<FastifyInstance> {
    const app = Fastify({ ajv: { customOptions: { allErrors: true } } });
    app.setErrorHandler(errorHandler);
    // authenticate no-op + user fake (as rotas usam request.user?.email).
    app.decorate('authenticate', async (request: { user?: unknown }) => {
        request.user = { sub: 'u1', email: 'tester@notagrafo.local', nome: 'Tester' };
    });
    await register(app);
    await app.ready();
    return app;
}
