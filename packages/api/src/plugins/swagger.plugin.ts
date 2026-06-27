import fp from 'fastify-plugin';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';

/**
 * Documentação OpenAPI 3.1 gerada a partir dos schemas das rotas, servida em /docs.
 */
export const swaggerPlugin = fp(async (app) => {
    await app.register(fastifySwagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'notagrafo API',
                description: 'API REST de processamento e consulta de NFes em grafo.',
                version: '1.0.0',
            },
            servers: [{ url: '/api/v1' }],
            components: {
                securitySchemes: {
                    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                },
            },
        },
    });

    await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
}, { name: 'swagger' });
