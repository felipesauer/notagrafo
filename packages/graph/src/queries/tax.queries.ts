import neo4j, { type Driver } from 'neo4j-driver';

/**
 * Queries de agregação fiscal (NOTA-58). Os totais por NF são lidos das
 * propriedades `total_*` do nó NotaFiscal (achatadas na gravação — Fase 1b),
 * o que mantém os KPIs a um `sum()` de distância. As agregações por NCM usam
 * os tributos granulares da aresta CONTÉM (imposto por item).
 *
 * Escopo fiscal: só tributos com XSD vigente (ICMS, IPI, PIS, COFINS, II,
 * ISSQN) — Reforma Tributária (CBS/IBS/IS) fora (ADR-3).
 */

export interface TaxFilters {
    dataInicio?: string; // ISO; filtra nf.dataEmissao >=
    dataFim?: string; // ISO; filtra nf.dataEmissao <=
    uf?: string; // UF do emitente
}

/** Totais por tributo (somados de todas as NFs do recorte). */
export interface TaxTotais {
    vICMS: number;
    vICMSST: number;
    vIPI: number;
    vPIS: number;
    vCOFINS: number;
    vII: number;
    vFCP: number;
}

/** Um ponto da série temporal mensal de carga tributária. */
export interface TaxSeriePonto {
    periodo: string; // YYYY-MM
    vICMS: number;
    vIPI: number;
    vPIS: number;
    vCOFINS: number;
}

export interface TaxSummary {
    totais: TaxTotais;
    serie: TaxSeriePonto[];
}

/** Ranking de imposto agregado por NCM (via aresta CONTÉM). */
export interface TaxByNcmItem {
    ncm: string;
    descricao?: string;
    vICMS: number;
    vIPI: number;
    vPIS: number;
    vCOFINS: number;
    totalImposto: number; // soma dos tributos acima — base da ordenação
    totalNFs: number;
}

/** Ranking de imposto agregado por CFOP (via total_* da NF). */
export interface TaxByCfopItem {
    cfop: string;
    descricao?: string;
    tipo?: string;
    vICMS: number;
    vIPI: number;
    totalNFs: number;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const toNum = (v: unknown): number =>
    typeof v === 'number'
        ? v
        : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
          ? (v as { toNumber: () => number }).toNumber()
          : Number(v ?? 0);

/** Monta WHERE + (se filtrar UF) o MATCH do emitente, parametrizado. */
function buildTaxWhere(f: TaxFilters): { match: string; where: string; params: Record<string, unknown> } {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    // Sempre parte da NF; só liga o emitente quando há filtro de UF.
    const match = f.uf ? 'MATCH (e:Empresa)-[:EMITIU]->(nf:NotaFiscal)' : 'MATCH (nf:NotaFiscal)';
    if (f.uf) (clauses.push('e.uf = $uf'), (params.uf = f.uf));
    if (f.dataInicio) (clauses.push('nf.dataEmissao >= $dataInicio'), (params.dataInicio = f.dataInicio));
    if (f.dataFim) (clauses.push('nf.dataEmissao <= $dataFim'), (params.dataFim = f.dataFim));
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return { match, where, params };
}

/**
 * KPIs de carga tributária (totais por tributo) + série mensal, somando as
 * propriedades total_* das NFs do recorte. coalesce trata NFs antigas sem totais.
 */
export async function taxSummary(driver: Driver, filters: TaxFilters = {}): Promise<TaxSummary> {
    const { match, where, params } = buildTaxWhere(filters);
    const session = driver.session();
    try {
        const totaisRes = await session.run(
            `${match}
             ${where}
             RETURN sum(coalesce(nf.total_vICMS, 0)) AS vICMS,
                    sum(coalesce(nf.total_vST, 0)) AS vICMSST,
                    sum(coalesce(nf.total_vIPI, 0)) AS vIPI,
                    sum(coalesce(nf.total_vPIS, 0)) AS vPIS,
                    sum(coalesce(nf.total_vCOFINS, 0)) AS vCOFINS,
                    sum(coalesce(nf.total_vII, 0)) AS vII,
                    sum(coalesce(nf.total_vFCP, 0)) AS vFCP`,
            params,
        );
        const t = totaisRes.records[0];
        const totais: TaxTotais = {
            vICMS: toNum(t?.get('vICMS')),
            vICMSST: toNum(t?.get('vICMSST')),
            vIPI: toNum(t?.get('vIPI')),
            vPIS: toNum(t?.get('vPIS')),
            vCOFINS: toNum(t?.get('vCOFINS')),
            vII: toNum(t?.get('vII')),
            vFCP: toNum(t?.get('vFCP')),
        };

        const serieRes = await session.run(
            `${match}
             ${where}
             WITH substring(nf.dataEmissao, 0, 7) AS periodo,
                  sum(coalesce(nf.total_vICMS, 0)) AS vICMS,
                  sum(coalesce(nf.total_vIPI, 0)) AS vIPI,
                  sum(coalesce(nf.total_vPIS, 0)) AS vPIS,
                  sum(coalesce(nf.total_vCOFINS, 0)) AS vCOFINS
             RETURN periodo, vICMS, vIPI, vPIS, vCOFINS
             ORDER BY periodo ASC`,
            params,
        );
        const serie: TaxSeriePonto[] = serieRes.records.map((r) => ({
            periodo: r.get('periodo') as string,
            vICMS: toNum(r.get('vICMS')),
            vIPI: toNum(r.get('vIPI')),
            vPIS: toNum(r.get('vPIS')),
            vCOFINS: toNum(r.get('vCOFINS')),
        }));

        return { totais, serie };
    } finally {
        await session.close();
    }
}

/**
 * Ranking de imposto agregado por NCM, somando os tributos da aresta CONTÉM
 * (imposto por item). A descrição vem do nó NCM (catálogo, Fase 1b). Aceita os
 * mesmos filtros de período/UF; ordena pela soma dos tributos.
 */
export async function taxByNcm(
    driver: Driver,
    filters: TaxFilters = {},
    limit = DEFAULT_LIMIT,
): Promise<TaxByNcmItem[]> {
    const lim = Math.min(limit, MAX_LIMIT);
    const clauses: string[] = [];
    const params: Record<string, unknown> = { limit: neo4j.int(lim) };
    // Liga emitente só quando filtra UF; sempre passa por CONTÉM → NCM.
    const matchEmit = filters.uf ? 'MATCH (e:Empresa)-[:EMITIU]->(nf)' : '';
    if (filters.uf) (clauses.push('e.uf = $uf'), (params.uf = filters.uf));
    if (filters.dataInicio) (clauses.push('nf.dataEmissao >= $dataInicio'), (params.dataInicio = filters.dataInicio));
    if (filters.dataFim) (clauses.push('nf.dataEmissao <= $dataFim'), (params.dataFim = filters.dataFim));
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (nf:NotaFiscal)-[c:CONTÉM]->(:Produto)-[:CLASSIFICADO_EM]->(ncm:NCM)
             ${matchEmit}
             ${where}
             WITH ncm,
                  sum(coalesce(c.vICMS, 0) + coalesce(c.vICMSST, 0)) AS vICMS,
                  sum(coalesce(c.vIPI, 0)) AS vIPI,
                  sum(coalesce(c.vPIS, 0)) AS vPIS,
                  sum(coalesce(c.vCOFINS, 0)) AS vCOFINS,
                  count(DISTINCT nf) AS totalNFs
             RETURN ncm.codigo AS ncm, ncm.descricao AS descricao,
                    vICMS, vIPI, vPIS, vCOFINS,
                    (vICMS + vIPI + vPIS + vCOFINS) AS totalImposto, totalNFs
             ORDER BY totalImposto DESC
             LIMIT $limit`,
            params,
        );
        return res.records.map((r) => {
            const descricao = r.get('descricao') as string | null;
            return {
                ncm: r.get('ncm') as string,
                ...(descricao ? { descricao } : {}),
                vICMS: toNum(r.get('vICMS')),
                vIPI: toNum(r.get('vIPI')),
                vPIS: toNum(r.get('vPIS')),
                vCOFINS: toNum(r.get('vCOFINS')),
                totalImposto: toNum(r.get('totalImposto')),
                totalNFs: toNum(r.get('totalNFs')),
            };
        });
    } finally {
        await session.close();
    }
}

/**
 * Ranking de imposto agregado por CFOP, somando os total_* das NFs por CFOP
 * principal (USA_CFOP). A descrição/tipo vêm do nó CFOP (catálogo, Fase 1b).
 */
export async function taxByCfop(
    driver: Driver,
    filters: TaxFilters = {},
    limit = DEFAULT_LIMIT,
): Promise<TaxByCfopItem[]> {
    const lim = Math.min(limit, MAX_LIMIT);
    const clauses: string[] = [];
    const params: Record<string, unknown> = { limit: neo4j.int(lim) };
    const matchEmit = filters.uf ? 'MATCH (e:Empresa)-[:EMITIU]->(nf)' : '';
    if (filters.uf) (clauses.push('e.uf = $uf'), (params.uf = filters.uf));
    if (filters.dataInicio) (clauses.push('nf.dataEmissao >= $dataInicio'), (params.dataInicio = filters.dataInicio));
    if (filters.dataFim) (clauses.push('nf.dataEmissao <= $dataFim'), (params.dataFim = filters.dataFim));
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (nf:NotaFiscal)-[:USA_CFOP]->(cfop:CFOP)
             ${matchEmit}
             ${where}
             WITH cfop,
                  sum(coalesce(nf.total_vICMS, 0)) AS vICMS,
                  sum(coalesce(nf.total_vIPI, 0)) AS vIPI,
                  count(DISTINCT nf) AS totalNFs
             RETURN cfop.codigo AS cfop, cfop.descricao AS descricao, cfop.tipo AS tipo,
                    vICMS, vIPI, totalNFs
             ORDER BY vICMS DESC
             LIMIT $limit`,
            params,
        );
        return res.records.map((r) => {
            const descricao = r.get('descricao') as string | null;
            const tipo = r.get('tipo') as string | null;
            return {
                cfop: r.get('cfop') as string,
                ...(descricao ? { descricao } : {}),
                ...(tipo ? { tipo } : {}),
                vICMS: toNum(r.get('vICMS')),
                vIPI: toNum(r.get('vIPI')),
                totalNFs: toNum(r.get('totalNFs')),
            };
        });
    } finally {
        await session.close();
    }
}
