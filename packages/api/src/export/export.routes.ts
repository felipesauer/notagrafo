import type { FastifyInstance } from 'fastify';
import type { NFFilters } from '@notagrafo/graph';
import { ApiError } from '../errors.js';
import { ExportService, type ExportFormato } from './export.service.js';

interface ExportBody {
    formato: ExportFormato;
    filtros?: NFFilters;
    campos?: string[];
}

export async function exportRoutes(app: FastifyInstance, service: ExportService): Promise<void> {
    // POST /export — cria o job assíncrono
    app.post<{ Body: ExportBody }>(
        '/export',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['export'],
                summary: 'Cria uma exportação assíncrona',
                body: {
                    type: 'object',
                    required: ['formato'],
                    properties: {
                        formato: { type: 'string', enum: ['csv', 'xlsx', 'json'] },
                        filtros: { type: 'object', additionalProperties: true },
                        campos: { type: 'array', items: { type: 'string' } },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const { formato, filtros, campos } = request.body;
            const job = service.create(formato, filtros, campos);
            reply.status(202).send({
                exportId: job.exportId,
                status: job.status,
                formato: job.formato,
                estimativa: 'A exportação será processada em segundo plano.',
            });
        },
    );

    // GET /export — lista o histórico de exportações (mais recentes primeiro)
    app.get(
        '/export',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['export'],
                summary: 'Lista as exportações (histórico)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        exportId: { type: 'string' },
                                        status: { type: 'string', enum: ['queued', 'processing', 'ready', 'failed'] },
                                        formato: { type: 'string', enum: ['csv', 'xlsx', 'json'] },
                                        progresso: { type: 'number' },
                                        total: { type: 'number' },
                                        totalRegistros: { type: 'number' },
                                        tamanhoBytes: { type: 'number' },
                                        expiresAt: { type: 'string' },
                                        erro: { type: 'string' },
                                        downloadUrl: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        async () => ({
            data: service.list().map((job) => ({
                exportId: job.exportId,
                status: job.status,
                formato: job.formato,
                totalRegistros: job.totalRegistros,
                tamanhoBytes: job.tamanhoBytes,
                expiresAt: new Date(job.expiresAt).toISOString(),
                // progresso/total úteis para jobs em andamento (paridade com GET /export/:id).
                ...(job.status === 'queued' || job.status === 'processing' ? { progresso: job.progresso, total: job.total } : {}),
                ...(job.erro ? { erro: job.erro } : {}),
                ...(job.status === 'ready' ? { downloadUrl: `/api/v1/export/${job.exportId}/download` } : {}),
            })),
        }),
    );

    // GET /export/:exportId — status; 410 se expirado
    app.get<{ Params: { exportId: string } }>(
        '/export/:exportId',
        {
            preHandler: app.authenticate,
            schema: { tags: ['export'], summary: 'Status de uma exportação', params: { type: 'object', properties: { exportId: { type: 'string' } }, required: ['exportId'] }, security: [{ bearerAuth: [] }] },
        },
        async (request) => {
            const job = await service.get(request.params.exportId);
            if (job === null) throw ApiError.notFound('EXPORT_NOT_FOUND', 'Exportação não encontrada.');
            if (job === 'expired') throw new ApiError(410, 'EXPORT_EXPIRED', 'O arquivo de exportação expirou e foi removido.');

            if (job.status === 'ready') {
                return {
                    exportId: job.exportId,
                    status: 'ready',
                    formato: job.formato,
                    tamanhoBytes: job.tamanhoBytes,
                    totalRegistros: job.totalRegistros,
                    expiresAt: new Date(job.expiresAt).toISOString(),
                    downloadUrl: `/api/v1/export/${job.exportId}/download`,
                };
            }
            // queued/processing/failed: inclui progresso e total (contrato §6).
            return {
                exportId: job.exportId,
                status: job.status,
                progresso: job.progresso,
                total: job.total,
                ...(job.erro ? { erro: job.erro } : {}),
            };
        },
    );

    // GET /export/:exportId/download — serve o arquivo
    app.get<{ Params: { exportId: string } }>(
        '/export/:exportId/download',
        {
            preHandler: app.authenticate,
            schema: { tags: ['export'], summary: 'Download do arquivo de exportação', params: { type: 'object', properties: { exportId: { type: 'string' } }, required: ['exportId'] }, security: [{ bearerAuth: [] }] },
        },
        async (request, reply) => {
            const job = await service.get(request.params.exportId);
            if (job === null) throw ApiError.notFound('EXPORT_NOT_FOUND', 'Exportação não encontrada.');
            if (job === 'expired') throw new ApiError(410, 'EXPORT_EXPIRED', 'O arquivo de exportação expirou e foi removido.');
            if (job.status !== 'ready') throw ApiError.badRequest('Exportação ainda não está pronta.');

            const data = await service.read(job);
            const date = new Date().toISOString().slice(0, 10);
            reply
                .header('Content-Type', service.contentType(job.formato))
                .header('Content-Disposition', `attachment; filename="nf-export-${date}.${job.formato}"`);
            return data;
        },
    );
}
