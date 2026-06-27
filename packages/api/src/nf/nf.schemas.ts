/** Schemas Fastify/JSON-Schema das rotas de NF (geram o OpenAPI). */

export const nfListQuerySchema = {
    type: 'object',
    properties: {
        chaveAcesso: { type: 'string' },
        numero: { type: 'string' },
        serie: { type: 'string' },
        dataEmissaoInicio: { type: 'string' },
        dataEmissaoFim: { type: 'string' },
        dataSaidaInicio: { type: 'string' },
        dataSaidaFim: { type: 'string' },
        valorTotalMin: { type: 'number' },
        valorTotalMax: { type: 'number' },
        status: { type: 'string', enum: ['ativa', 'cancelada', 'denegada', 'inutilizada'] },
        tipoNF: { type: 'string', enum: ['entrada', 'saida'] },
        finalidade: { type: 'string', enum: ['normal', 'complementar', 'ajuste', 'devolucao'] },
        naturezaOp: { type: 'string' },
        cnpjEmitente: { type: 'string' },
        cnpjDestinatario: { type: 'string' },
        ufEmitente: { type: 'string' },
        ufDestinatario: { type: 'string' },
        cfop: { type: 'string' },
        ncm: { type: 'string' },
        q: { type: 'string' },
        cursor: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        orderBy: { type: 'string' },
        order: { type: 'string', enum: ['asc', 'desc'] },
    },
    additionalProperties: false,
} as const;

export const nfUploadResponse = {
    type: 'object',
    properties: {
        jobId: { type: 'string' },
        status: { type: 'string' },
        arquivos: { type: 'integer' },
        mensagem: { type: 'string' },
    },
} as const;

export const nfDetailResponse = {
    type: 'object',
    properties: {
        chaveAcesso: { type: 'string' },
        numero: { type: 'string' },
        serie: { type: 'string' },
        valorTotal: { type: 'number' },
        status: { type: 'string' },
        emitente: { type: 'object', additionalProperties: true },
        destinatario: { type: 'object', additionalProperties: true },
        itens: { type: 'array', items: { type: 'object', additionalProperties: true } },
    },
    additionalProperties: true,
} as const;
