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

// Bloco `tributos` de um item — valores do XSD vigente (.plan/01 §tributos).
const tributosSchema = {
    type: 'object',
    properties: {
        vICMS: { type: 'number' },
        vBCICMS: { type: 'number' },
        pICMS: { type: 'number' },
        vBCST: { type: 'number' },
        vICMSST: { type: 'number' },
        vFCP: { type: 'number' },
        vICMSDeson: { type: 'number' },
        vIPI: { type: 'number' },
        vPIS: { type: 'number' },
        vCOFINS: { type: 'number' },
        vII: { type: 'number' },
        vISSQN: { type: 'number' },
    },
    additionalProperties: true,
} as const;

// Totais da NF — grupo total/ICMSTot (gravados como total_* e reexpostos sem prefixo).
const totaisSchema = {
    type: 'object',
    properties: {
        vNF: { type: 'number' },
        vProd: { type: 'number' },
        vICMS: { type: 'number' },
        vICMSDeson: { type: 'number' },
        vFCP: { type: 'number' },
        vST: { type: 'number' },
        vIPI: { type: 'number' },
        vPIS: { type: 'number' },
        vCOFINS: { type: 'number' },
        vII: { type: 'number' },
        vFrete: { type: 'number' },
        vSeg: { type: 'number' },
        vDesc: { type: 'number' },
        vOutro: { type: 'number' },
    },
    additionalProperties: true,
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
        cfop: {
            type: 'object',
            properties: { codigo: { type: 'string' }, descricao: { type: 'string' } },
            additionalProperties: true,
        },
        itens: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    numeroItem: { type: 'number' },
                    quantidade: { type: 'number' },
                    valorUnitario: { type: 'number' },
                    valorTotal: { type: 'number' },
                    desconto: { type: 'number' },
                    cst: { type: 'string' },
                    cest: { type: 'string' },
                    produto: { type: 'object', additionalProperties: true },
                    tributos: tributosSchema,
                },
                additionalProperties: true,
            },
        },
        totais: totaisSchema,
    },
    additionalProperties: true,
} as const;
