import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import type { Queue } from 'bullmq';
import { validarNFe, parseNFe, VersaoSchemaNaoSuportadaError } from '@notagrafo/core';
import {
    listNotasFiscais,
    countNotasFiscais,
    filtrosAtivos,
    getNotaFiscal,
    type NFFilters,
    type NFPageOptions,
} from '@notagrafo/graph';
import {
    enqueueNFe,
    NotaFiscalDuplicadaError,
    type XmlStorage,
    type ProcessNFeJobData,
} from '@notagrafo/worker';
import { ApiError } from '../errors.js';
import { registrarConsulta } from './audit.hook.js';
import { extrairXmls } from './upload.utils.js';
import { nfListQuerySchema, nfUploadResponse, nfDetailResponse } from './nf.schemas.js';

export interface NFRouteDeps {
    driver: Driver;
    queue: Queue<ProcessNFeJobData>;
    storage: XmlStorage;
}

export async function nfRoutes(app: FastifyInstance, deps: NFRouteDeps): Promise<void> {
    const { driver, queue, storage } = deps;

    // POST /nf/upload — XML único ou ZIP; valida XSD antes de enfileirar.
    app.post(
        '/nf/upload',
        {
            preHandler: app.authenticate,
            schema: { tags: ['nf'], summary: 'Upload de NFe (XML ou ZIP)', consumes: ['multipart/form-data'], security: [{ bearerAuth: [] }], response: { 202: nfUploadResponse } },
        },
        async (request, reply) => {
            const file = await request.file();
            if (!file) throw ApiError.badRequest('Campo "file" obrigatório (multipart).');
            const buffer = await file.toBuffer();
            const xmls = extrairXmls(buffer, file.filename);
            if (xmls.length === 0) throw ApiError.badRequest('Nenhum XML encontrado no upload.');

            // Valida XSD de todos antes de enfileirar qualquer um.
            for (const x of xmls) {
                let res;
                try {
                    res = validarNFe(x.conteudo);
                } catch (err) {
                    if (err instanceof VersaoSchemaNaoSuportadaError) throw ApiError.unsupportedSchema(err.message);
                    throw ApiError.invalidXml(`Falha ao validar ${x.nome}.`, [String((err as Error).message)]);
                }
                if (!res.valid) {
                    throw ApiError.invalidXml(`O XML ${x.nome} não passou na validação do XSD NFe v${res.versao}.`, res.errors);
                }
            }

            // Atomicidade: extrai a chave de todos, detecta duplicata intra-lote e
            // checa o grafo de TODOS antes de enfileirar qualquer um — sem
            // enfileiramento parcial em caso de duplicata (achado #8 da auditoria).
            const vistas = new Set<string>();
            for (const x of xmls) {
                const chave = parseNFe(x.conteudo, new Date()).nota.chaveAcesso;
                if (vistas.has(chave)) {
                    throw new ApiError(409, 'DUPLICATE_NF', `NFe com chave de acesso ${chave} aparece mais de uma vez no upload.`, [`chaveAcesso=${chave}`]);
                }
                vistas.add(chave);
                const existente = await getNotaFiscal(driver, chave);
                if (existente) {
                    throw new ApiError(409, 'DUPLICATE_NF', `NFe com chave de acesso ${chave} já foi processada.`, [`chaveAcesso=${chave}`]);
                }
            }

            // Todos validados e sem duplicata: enfileira o lote inteiro.
            let primeiroJobId = '';
            let enfileiradas = 0;
            for (const x of xmls) {
                try {
                    const r = await enqueueNFe(queue, driver, x.conteudo, { origem: file.filename });
                    primeiroJobId ||= r.jobId;
                    enfileiradas++;
                } catch (err) {
                    if (err instanceof NotaFiscalDuplicadaError) {
                        // Corrida rara (duplicata entre a checagem e o enqueue): reporta 409.
                        throw new ApiError(409, 'DUPLICATE_NF', `NFe com chave de acesso ${err.chaveAcesso} já foi processada.`, [`chaveAcesso=${err.chaveAcesso}`]);
                    }
                    throw err;
                }
            }

            reply.status(202).send({
                jobId: primeiroJobId,
                status: 'queued',
                arquivos: enfileiradas,
                mensagem: enfileiradas === 1 ? 'NFe enfileirada para processamento.' : `${enfileiradas} NFes enfileiradas para processamento.`,
            });
        },
    );

    // GET /nf/jobs/:jobId — status do job.
    app.get<{ Params: { jobId: string } }>(
        '/nf/jobs/:jobId',
        { preHandler: app.authenticate, schema: { tags: ['nf'], summary: 'Status de um job', params: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] }, security: [{ bearerAuth: [] }] } },
        async (request) => {
            const job = await queue.getJob(request.params.jobId);
            if (!job) throw ApiError.notFound('JOB_NOT_FOUND', 'Job não encontrado.');
            const state = await job.getState();
            const progresso = typeof job.progress === 'number' ? job.progress : 0;

            // Job com falha (DLQ): só erro + tentativas (contrato seção 3).
            if (state === 'failed') {
                return {
                    jobId: job.id,
                    status: 'failed',
                    erro: job.failedReason ?? 'Falha desconhecida no processamento.',
                    tentativas: job.attemptsMade,
                };
            }

            // Cada job processa exatamente 1 NFe (enqueueNFe enfileira 1 XML por job;
            // duplicatas são bloqueadas antes de enfileirar). Logo total = 1.
            const total = 1;

            // Concluído: inclui concluidoEm + resultado{processadas,duplicatas,erros}.
            if (state === 'completed') {
                return {
                    jobId: job.id,
                    status: 'completed',
                    progresso,
                    total,
                    ...(job.processedOn ? { iniciadoEm: new Date(job.processedOn).toISOString() } : {}),
                    ...(job.finishedOn ? { concluidoEm: new Date(job.finishedOn).toISOString() } : {}),
                    resultado: { processadas: 1, duplicatas: 0, erros: 0 },
                };
            }

            // Demais estados do BullMQ (waiting/active/delayed/paused/...) → 'processing'
            // no contrato §3, que só define processing | completed | failed.
            return {
                jobId: job.id,
                status: 'processing',
                progresso,
                total,
                ...(job.processedOn ? { iniciadoEm: new Date(job.processedOn).toISOString() } : {}),
            };
        },
    );

    // GET /nf — listagem com filtros + paginação cursor-based.
    app.get<{ Querystring: NFFilters & NFPageOptions }>(
        '/nf',
        { preHandler: app.authenticate, schema: { tags: ['nf'], summary: 'Lista NFes', querystring: nfListQuerySchema, security: [{ bearerAuth: [] }] } },
        async (request) => {
            const { cursor, limit, orderBy, order, ...filters } = request.query;
            const [page, total] = await Promise.all([
                listNotasFiscais(driver, filters as NFFilters, {
                    ...(cursor ? { cursor } : {}),
                    ...(limit ? { limit: Number(limit) } : {}),
                    ...(orderBy ? { orderBy } : {}),
                    ...(order ? { order } : {}),
                }),
                countNotasFiscais(driver, filters as NFFilters),
            ]);
            return {
                data: page.data,
                pagination: { nextCursor: page.nextCursor, limit: page.limit, hasMore: page.hasMore },
                meta: { total, filtrosAtivos: filtrosAtivos(filters as NFFilters) },
            };
        },
    );

    // GET /nf/:chave — detalhe com itens; cria evento 'consultada' assíncrono.
    app.get<{ Params: { chave: string } }>(
        '/nf/:chave',
        { preHandler: app.authenticate, schema: { tags: ['nf'], summary: 'Detalhe de uma NFe', params: { type: 'object', properties: { chave: { type: 'string' } }, required: ['chave'] }, security: [{ bearerAuth: [] }], response: { 200: nfDetailResponse } },
        },
        async (request) => {
            const nf = await getNotaFiscal(driver, request.params.chave);
            if (!nf) throw ApiError.notFound('NF_NOT_FOUND', 'NFe não encontrada.');
            registrarConsulta(driver, request.params.chave, { autor: request.user?.email, ipOrigem: request.ip }, (err) => request.log.warn({ err }, 'falha ao registrar evento consultada'));
            return nf;
        },
    );

    // GET /nf/:chave/xml — XML original do storage.
    app.get<{ Params: { chave: string } }>(
        '/nf/:chave/xml',
        { preHandler: app.authenticate, schema: { tags: ['nf'], summary: 'XML original da NFe', params: { type: 'object', properties: { chave: { type: 'string' } }, required: ['chave'] }, security: [{ bearerAuth: [] }] } },
        async (request, reply) => {
            if (!(await storage.exists(request.params.chave))) {
                throw ApiError.notFound('NF_NOT_FOUND', 'XML da NFe não encontrado.');
            }
            const xml = await storage.get(request.params.chave);
            reply.header('Content-Type', 'application/xml');
            return xml;
        },
    );

    // GET /nf/:chave/eventos — auditoria da NF.
    app.get<{ Params: { chave: string } }>(
        '/nf/:chave/eventos',
        { preHandler: app.authenticate, schema: { tags: ['nf'], summary: 'Eventos de auditoria da NFe', params: { type: 'object', properties: { chave: { type: 'string' } }, required: ['chave'] }, security: [{ bearerAuth: [] }] } },
        async (request) => {
            const session = driver.session();
            try {
                // MATCH na NF + OPTIONAL nos eventos: distingue "NF inexistente" (0 linhas)
                // de "NF sem eventos" (1 linha com ev = null).
                const res = await session.run(
                    `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                     OPTIONAL MATCH (nf)-[:TEM_EVENTO]->(ev:Evento)
                     RETURN ev.tipo AS tipo, toString(ev.timestamp) AS timestamp, ev.autor AS autor, ev.ipOrigem AS ipOrigem
                     ORDER BY ev.timestamp DESC`,
                    { chave: request.params.chave },
                );
                if (res.records.length === 0) {
                    throw ApiError.notFound('NF_NOT_FOUND', 'NFe não encontrada.');
                }
                return {
                    chaveAcesso: request.params.chave,
                    // Filtra a linha sentinela quando a NF existe mas não tem eventos (ev = null).
                    eventos: res.records
                        .filter((r) => r.get('tipo') !== null)
                        .map((r) => ({
                            tipo: r.get('tipo'),
                            // Neo4j datetime → ISO8601 com milissegundos (contrato §4).
                            timestamp: new Date(r.get('timestamp')).toISOString(),
                            autor: r.get('autor'),
                            ...(r.get('ipOrigem') ? { ipOrigem: r.get('ipOrigem') } : {}),
                        })),
                };
            } finally {
                await session.close();
            }
        },
    );
}
