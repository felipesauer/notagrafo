import neo4j, { type Driver } from 'neo4j-driver';

/** Filtros do GET /api/v1/nf (seção 4 do 02 contratos api.md). */
export interface NFFilters {
    chaveAcesso?: string;
    numero?: string;
    serie?: string;
    dataEmissaoInicio?: string;
    dataEmissaoFim?: string;
    dataSaidaInicio?: string;
    dataSaidaFim?: string;
    valorTotalMin?: number;
    valorTotalMax?: number;
    status?: string;
    tipoNF?: string;
    finalidade?: string;
    naturezaOp?: string; // contains
    cnpjEmitente?: string;
    cnpjDestinatario?: string;
    ufEmitente?: string;
    ufDestinatario?: string;
    cfop?: string;
    ncm?: string; // exato ou prefixo
    q?: string; // fulltext (chave, número, natureza)
    // Filtros fiscais (sobre os totais total_* do nó — Fase 1b/EPIC-11)
    vICMSMin?: number; // nf.total_vICMS >=
    vICMSMax?: number; // nf.total_vICMS <=
    comImposto?: boolean; // true: total_vICMS > 0; false: sem ICMS (0 ou ausente)
    // Reforma Tributária (EPIC-25): recorta NF-e já sob a reforma.
    comReforma?: boolean; // true: total_vIBS>0 OU total_vCBS>0; false: sem IBS/CBS
}

export interface NFPageOptions {
    cursor?: string;
    limit?: number; // padrão 50, máx 200
    orderBy?: string; // padrão dataEmissao
    order?: 'asc' | 'desc'; // padrão desc
}

export interface NFListItem {
    chaveAcesso: string;
    numero: string;
    serie: string;
    dataEmissao: string;
    dataSaida: string;
    valorTotal: number;
    status: string;
    tipoNF: string;
    finalidade: string;
    naturezaOp?: string;
    emitente?: { cnpj: string; razaoSocial: string; uf: string };
    destinatario?: { cnpj: string; razaoSocial: string; uf: string };
    importadaEm: string;
    processadaEm?: string;
    // Totais de tributo da NF (props total_* achatadas na gravação) — expostos
    // para a exportação (EPIC-25). Ausentes viram 0. Inclui a Reforma (IBS/CBS/IS).
    tributos: {
        vICMS: number; vICMSST: number; vIPI: number; vPIS: number; vCOFINS: number; vFCP: number;
        vIBS: number; vIBSUF: number; vIBSMun: number; vCBS: number; vIS: number;
    };
}

export interface NFPage {
    data: NFListItem[];
    nextCursor: string | null;
    limit: number;
    hasMore: boolean;
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const ORDERABLE = new Set(['dataEmissao', 'dataSaida', 'valorTotal', 'numero', 'chaveAcesso']);

const toNum = (v: unknown): number =>
    typeof v === 'number'
        ? v
        : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
          ? (v as { toNumber: () => number }).toNumber()
          : Number(v ?? 0);

interface Cursor {
    v: string | number; // valor do orderBy do último item
    chave: string; // desempate estável
}

function encodeCursor(c: Cursor): string {
    return Buffer.from(JSON.stringify(c), 'utf8').toString('base64');
}
function decodeCursor(s: string): Cursor {
    return JSON.parse(Buffer.from(s, 'base64').toString('utf8')) as Cursor;
}

/** Monta as cláusulas WHERE a partir dos filtros, sem injeção (tudo parametrizado). */
function buildWhere(f: NFFilters): { clauses: string[]; params: Record<string, unknown> } {
    const c: string[] = [];
    const p: Record<string, unknown> = {};
    const eq = (field: string, val: unknown, key = field) => {
        if (val !== undefined && val !== '') {
            c.push(`nf.${field} = $${key}`);
            p[key] = val;
        }
    };
    eq('chaveAcesso', f.chaveAcesso);
    eq('numero', f.numero);
    eq('serie', f.serie);
    eq('status', f.status);
    eq('tipoNF', f.tipoNF);
    eq('finalidade', f.finalidade);
    if (f.dataEmissaoInicio) (c.push('nf.dataEmissao >= $dataEmissaoInicio'), (p.dataEmissaoInicio = f.dataEmissaoInicio));
    if (f.dataEmissaoFim) (c.push('nf.dataEmissao <= $dataEmissaoFim'), (p.dataEmissaoFim = f.dataEmissaoFim));
    if (f.dataSaidaInicio) (c.push('nf.dataSaida >= $dataSaidaInicio'), (p.dataSaidaInicio = f.dataSaidaInicio));
    if (f.dataSaidaFim) (c.push('nf.dataSaida <= $dataSaidaFim'), (p.dataSaidaFim = f.dataSaidaFim));
    if (f.valorTotalMin !== undefined) (c.push('nf.valorTotal >= $valorTotalMin'), (p.valorTotalMin = f.valorTotalMin));
    if (f.valorTotalMax !== undefined) (c.push('nf.valorTotal <= $valorTotalMax'), (p.valorTotalMax = f.valorTotalMax));
    if (f.naturezaOp) (c.push('toLower(nf.naturezaOp) CONTAINS toLower($naturezaOp)'), (p.naturezaOp = f.naturezaOp));
    if (f.q) (c.push('(nf.chaveAcesso CONTAINS $q OR nf.numero CONTAINS $q OR toLower(coalesce(nf.naturezaOp,"")) CONTAINS toLower($q))'), (p.q = f.q));
    // Filtros fiscais sobre o ICMS total da NF (coalesce trata NF sem o total gravado).
    if (f.vICMSMin !== undefined) (c.push('coalesce(nf.total_vICMS, 0) >= $vICMSMin'), (p.vICMSMin = f.vICMSMin));
    if (f.vICMSMax !== undefined) (c.push('coalesce(nf.total_vICMS, 0) <= $vICMSMax'), (p.vICMSMax = f.vICMSMax));
    if (f.comImposto !== undefined) c.push(f.comImposto ? 'coalesce(nf.total_vICMS, 0) > 0' : 'coalesce(nf.total_vICMS, 0) = 0');
    if (f.comReforma !== undefined) {
        c.push(f.comReforma
            ? '(coalesce(nf.total_vIBS, 0) > 0 OR coalesce(nf.total_vCBS, 0) > 0)'
            : '(coalesce(nf.total_vIBS, 0) = 0 AND coalesce(nf.total_vCBS, 0) = 0)');
    }
    return { clauses: c, params: p };
}

/**
 * Monta a parte de MATCH + WHERE comum à listagem e à contagem, a partir
 * dos filtros (sem cursor nem paginação). Tudo parametrizado (sem injeção).
 */
function buildFilterQuery(filters: NFFilters): {
    matchRel: string[];
    clauses: string[];
    params: Record<string, unknown>;
    /** Variáveis extras (além de nf/emit/dest) que o WHERE de filtro referencia e
     * que precisam sobreviver ao WITH que precede o WHERE (ex.: ncm). */
    withVars: string[];
} {
    const { clauses, params } = buildWhere(filters);
    const withVars: string[] = [];

    // Relações com emitente/destinatário para filtros por CNPJ/UF.
    const matchRel: string[] = ['MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)', 'OPTIONAL MATCH (nf)-[:DESTINADA_A]->(dest:Empresa)'];
    if (filters.cnpjEmitente) (clauses.push('emit.cnpj = $cnpjEmitente'), (params.cnpjEmitente = filters.cnpjEmitente));
    if (filters.ufEmitente) (clauses.push('emit.uf = $ufEmitente'), (params.ufEmitente = filters.ufEmitente));
    if (filters.cnpjDestinatario) (clauses.push('dest.cnpj = $cnpjDestinatario'), (params.cnpjDestinatario = filters.cnpjDestinatario));
    if (filters.ufDestinatario) (clauses.push('dest.uf = $ufDestinatario'), (params.ufDestinatario = filters.ufDestinatario));
    if (filters.cfop) (matchRel.push('MATCH (nf)-[:USA_CFOP]->(:CFOP {codigo: $cfop})'), (params.cfop = filters.cfop));
    if (filters.ncm) (matchRel.push('MATCH (nf)-[:CONTÉM]->(:Produto)-[:CLASSIFICADO_EM]->(ncm:NCM)'), clauses.push('ncm.codigo STARTS WITH $ncm'), (params.ncm = filters.ncm), withVars.push('ncm'));

    return { matchRel, clauses, params, withVars };
}

/** Lista das chaves de filtro efetivamente aplicadas (meta.filtrosAtivos do contrato §4). */
export function activeFilters(filters: NFFilters): string[] {
    return (Object.keys(filters) as (keyof NFFilters)[]).filter((k) => {
        const v = filters[k];
        return v !== undefined && v !== '';
    });
}

/**
 * Conta o total de NFes respeitando os mesmos filtros da listagem (meta.total do §4).
 * Usa DISTINCT pois MATCHes de produto/ncm podem multiplicar linhas por nota.
 */
export async function countInvoices(driver: Driver, filters: NFFilters = {}): Promise<number> {
    const { matchRel, clauses, params, withVars } = buildFilterQuery(filters);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const withList = ['nf', 'emit', 'dest', ...withVars].join(', ');
    const cypher = `${matchRel.join('\n')}\nWITH ${withList}\n${where}\nRETURN count(DISTINCT nf) AS total`;
    const session = driver.session();
    try {
        const res = await session.run(cypher, params);
        return toNum(res.records[0]?.get('total'));
    } finally {
        await session.close();
    }
}

/**
 * Lista NFes com todos os filtros do GET /nf e paginação cursor-based (keyset).
 * O cursor é opaco (base64 de {valor do orderBy, chaveAcesso}) — keyset pagination,
 * estável e sem offset. limit padrão 50, máx 200.
 */
export async function listInvoices(
    driver: Driver,
    filters: NFFilters = {},
    opts: NFPageOptions = {},
): Promise<NFPage> {
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const orderBy = ORDERABLE.has(opts.orderBy ?? '') ? opts.orderBy! : 'dataEmissao';
    const order = opts.order === 'asc' ? 'asc' : 'desc';
    const cmp = order === 'asc' ? '>' : '<';

    const { matchRel, clauses, params, withVars } = buildFilterQuery(filters);

    // 1º WITH (após os MATCH/OPTIONAL MATCH) carrega nf/emit/dest — e as variáveis
    // extras que o WHERE de filtro referencia (ex.: ncm) — para que o WHERE filtre o
    // conjunto inteiro e não fique preso ao último OPTIONAL MATCH.
    const withList = ['nf', 'emit', 'dest', ...withVars].join(', ');
    const filterWhere = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    // O filtro de cursor só usa nf, então vai após o WITH DISTINCT.
    let cursorWhere = '';
    if (opts.cursor) {
        const cur = decodeCursor(opts.cursor);
        cursorWhere = `WHERE (nf.${orderBy} ${cmp} $cursorV OR (nf.${orderBy} = $cursorV AND nf.chaveAcesso ${cmp} $cursorChave))`;
        params.cursorV = cur.v;
        params.cursorChave = cur.chave;
    }

    // 2º WITH DISTINCT deduplica: os MATCH de CONTÉM->NCM / USA_CFOP multiplicam
    // linhas quando a NF tem vários itens no mesmo NCM (ou vários USA_CFOP), o que
    // sem DISTINCT retornaria a mesma NF repetida na página (emit/dest são 1:1 com a
    // NF). Espelha o count(DISTINCT nf) de countInvoices.
    const cypher =
        `${matchRel.join('\n')}\n` +
        `WITH ${withList}\n` +
        `${filterWhere}\n` +
        `WITH DISTINCT nf, emit, dest\n` +
        `${cursorWhere}\n` +
        `RETURN nf, emit, dest\n` +
        `ORDER BY nf.${orderBy} ${order}, nf.chaveAcesso ${order}\n` +
        `LIMIT $limitPlus1`;

    const session = driver.session();
    try {
        const res = await session.run(cypher, { ...params, limitPlus1: neo4j.int(limit + 1) });
        const rows = res.records;
        const hasMore = rows.length > limit;
        const page = rows.slice(0, limit);

        const data: NFListItem[] = page.map((r) => {
            const nf = (r.get('nf') as { properties: Record<string, unknown> }).properties;
            const emit = r.get('emit') as { properties: Record<string, unknown> } | null;
            const dest = r.get('dest') as { properties: Record<string, unknown> } | null;
            const empresa = (n: { properties: Record<string, unknown> } | null) =>
                n ? { cnpj: String(n.properties.cnpj), razaoSocial: String(n.properties.razaoSocial ?? ''), uf: String(n.properties.uf ?? '') } : undefined;
            return {
                chaveAcesso: String(nf.chaveAcesso),
                numero: String(nf.numero ?? ''),
                serie: String(nf.serie ?? ''),
                dataEmissao: String(nf.dataEmissao ?? ''),
                dataSaida: String(nf.dataSaida ?? ''),
                valorTotal: toNum(nf.valorTotal),
                status: String(nf.status ?? ''),
                tipoNF: String(nf.tipoNF ?? ''),
                finalidade: String(nf.finalidade ?? ''),
                ...(nf.naturezaOp ? { naturezaOp: String(nf.naturezaOp) } : {}),
                ...(empresa(emit) ? { emitente: empresa(emit) } : {}),
                ...(empresa(dest) ? { destinatario: empresa(dest) } : {}),
                importadaEm: String(nf.importadaEm ?? ''),
                ...(nf.processadaEm ? { processadaEm: String(nf.processadaEm) } : {}),
                tributos: {
                    vICMS: toNum(nf.total_vICMS), vICMSST: toNum(nf.total_vST), vIPI: toNum(nf.total_vIPI),
                    vPIS: toNum(nf.total_vPIS), vCOFINS: toNum(nf.total_vCOFINS), vFCP: toNum(nf.total_vFCP),
                    vIBS: toNum(nf.total_vIBS), vIBSUF: toNum(nf.total_vIBSUF), vIBSMun: toNum(nf.total_vIBSMun),
                    vCBS: toNum(nf.total_vCBS), vIS: toNum(nf.total_vIS),
                },
            };
        });

        let nextCursor: string | null = null;
        if (hasMore && data.length > 0) {
            const last = data[data.length - 1]!;
            const v = (last as unknown as Record<string, string | number>)[orderBy] ?? last.dataEmissao;
            nextCursor = encodeCursor({ v, chave: last.chaveAcesso });
        }

        return { data, nextCursor, limit, hasMore };
    } finally {
        await session.close();
    }
}

/** Detalhe completo de uma NF, incluindo itens (produto + valores da aresta CONTÉM). */
export async function getInvoice(driver: Driver, chaveAcesso: string): Promise<Record<string, unknown> | null> {
    const session = driver.session();
    try {
        // Itens e CFOPs são coletados em ramos SEPARADOS (WITH) para evitar o
        // produto cartesiano USA_CFOP × CONTÉM, que numa NF multi-CFOP duplicaria
        // linhas e descartaria CFOPs (auditoria A1). Uma NF pode ter vários CFOPs.
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal {chaveAcesso: $chave})
             OPTIONAL MATCH (nf)-[:DESTINADA_A]->(dest:Empresa)
             OPTIONAL MATCH (nf)-[c:CONTÉM]->(prod:Produto)
             OPTIONAL MATCH (prod)-[:CLASSIFICADO_EM]->(ncm:NCM)
             WITH nf, emit, dest, collect({item: c, produto: prod, ncm: ncm}) AS itens
             OPTIONAL MATCH (nf)-[:USA_CFOP]->(cfop:CFOP)
             RETURN nf, emit, dest, itens, collect(DISTINCT cfop) AS cfops`,
            { chave: chaveAcesso },
        );
        const r = res.records[0];
        if (!r) return null;
        const nf = (r.get('nf') as { properties: Record<string, unknown> }).properties;
        const emit = r.get('emit') as { properties: Record<string, unknown> } | null;
        const dest = r.get('dest') as { properties: Record<string, unknown> } | null;
        const cfopNodes = (r.get('cfops') as Array<{ properties: Record<string, unknown> }>).map((c) => c.properties);
        const itensRaw = r.get('itens') as Array<{
            item: { properties: Record<string, unknown> } | null;
            produto: { properties: Record<string, unknown> } | null;
            ncm: { properties: Record<string, unknown> } | null;
        }>;
        const itens = itensRaw
            .filter((i) => i.produto)
            .map((i) => ({
                ...i.item?.properties,
                produto: i.produto?.properties,
                ncm: i.ncm?.properties,
            }));
        return {
            ...nf,
            emitente: emit?.properties,
            destinatario: dest?.properties,
            // cfop = primeiro (compat. com o contrato/UI de campo único); cfops = todos.
            ...(cfopNodes[0] ? { cfop: cfopNodes[0] } : {}),
            ...(cfopNodes.length ? { cfops: cfopNodes } : {}),
            itens,
        };
    } finally {
        await session.close();
    }
}

/** Um evento de auditoria no feed global, com a NF a que pertence. */
export interface EventoGlobal {
    tipo: string;
    timestamp: string;
    autor: string | null;
    chaveAcesso: string;
    numero: string;
}

export interface EventosPage {
    eventos: EventoGlobal[];
    total: number;
}

/**
 * Feed global de eventos de auditoria (todas as NFs), mais recentes primeiro.
 * Alimenta a tela unificada de eventos. `tipo` filtra opcionalmente por tipo.
 */
export async function listEventos(
    driver: Driver,
    opts: { limit?: number; offset?: number; tipo?: string } = {},
): Promise<EventosPage> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);
    const filtroTipo = opts.tipo ? 'WHERE ev.tipo = $tipo' : '';
    const session = driver.session();
    try {
        const totalRes = await session.run(
            `MATCH (:NotaFiscal)-[:TEM_EVENTO]->(ev:Evento) ${filtroTipo}
             RETURN count(ev) AS total`,
            { ...(opts.tipo ? { tipo: opts.tipo } : {}) },
        );
        const res = await session.run(
            `MATCH (nf:NotaFiscal)-[:TEM_EVENTO]->(ev:Evento) ${filtroTipo}
             RETURN ev.tipo AS tipo, toString(ev.timestamp) AS timestamp, ev.autor AS autor,
                    nf.chaveAcesso AS chaveAcesso, nf.numero AS numero
             ORDER BY ev.timestamp DESC
             SKIP $offset LIMIT $limit`,
            { offset: neo4j.int(offset), limit: neo4j.int(limit), ...(opts.tipo ? { tipo: opts.tipo } : {}) },
        );
        const toNum = (v: unknown): number =>
            typeof v === 'number' ? v : v && typeof (v as { toNumber?: () => number }).toNumber === 'function' ? (v as { toNumber: () => number }).toNumber() : Number(v ?? 0);
        return {
            total: toNum(totalRes.records[0]?.get('total')),
            eventos: res.records.map((r) => ({
                tipo: r.get('tipo') as string,
                timestamp: new Date(r.get('timestamp') as string).toISOString(),
                autor: (r.get('autor') as string | null) ?? null,
                chaveAcesso: r.get('chaveAcesso') as string,
                numero: (r.get('numero') as string) ?? '',
            })),
        };
    } finally {
        await session.close();
    }
}
