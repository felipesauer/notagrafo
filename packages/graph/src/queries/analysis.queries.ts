import neo4j, { type Driver } from 'neo4j-driver';

/** Neo4j integer for LIMIT params (driver requires an integer, not a float). */
const neo4jInt = (n: number) => neo4j.int(n);

/**
 * Analysis queries (fiscal BI — EPIC-26): period comparison and anomaly
 * detection (duplicates, numbering gaps). Analysis scope: they flag, never fix.
 * All ignore stub NFs (status IS NULL). Domain terms (NF, dataEmissao) stay in PT.
 */

const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'toNumber' in v) return (v as { toNumber(): number }).toNumber();
    return Number(v ?? 0);
};

/** Totals of a period (NF count + summed value). */
export interface PeriodTotals {
    totalNFs: number;
    valorTotal: number;
}

export interface PeriodComparison {
    current: PeriodTotals;
    previous: PeriodTotals; // immediately preceding period, same duration
    yearAgo: PeriodTotals; // same interval one year earlier (YoY)
    // fractional change of current vs each baseline (undefined when baseline is 0)
    changeVsPrevious: { totalNFs?: number; valorTotal?: number };
    changeVsYearAgo: { totalNFs?: number; valorTotal?: number };
}

/** Shifts an ISO date (YYYY-MM-DD...) by `days`, keeping the date format. */
function shiftIsoDate(iso: string, days: number): string {
    const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Inclusive number of days between two ISO dates. */
function dayspan(start: string, end: string): number {
    const a = new Date(start.slice(0, 10) + 'T00:00:00Z').getTime();
    const b = new Date(end.slice(0, 10) + 'T00:00:00Z').getTime();
    return Math.round((b - a) / 86_400_000) + 1;
}

const frac = (current: number, base: number): number | undefined =>
    base === 0 ? undefined : (current - base) / base;

/**
 * Compares totals of [dataInicio, dataFim] with the immediately preceding period
 * of the same duration and with the same interval one year earlier (YoY). One
 * query per period (3 total), summing NF count/value by dataEmissao.
 */
export async function getPeriodComparison(
    driver: Driver,
    dataInicio: string,
    dataFim: string,
): Promise<PeriodComparison> {
    const span = dayspan(dataInicio, dataFim);
    // Previous window: ends the day before dataInicio, same duration.
    const prevEnd = shiftIsoDate(dataInicio, -1);
    const prevStart = shiftIsoDate(prevEnd, -(span - 1));
    // YoY: same interval, one year earlier (365 days).
    const yoyStart = shiftIsoDate(dataInicio, -365);
    const yoyEnd = shiftIsoDate(dataFim, -365);

    const session = driver.session();
    try {
        const sumPeriod = async (start: string, end: string): Promise<PeriodTotals> => {
            const res = await session.run(
                `MATCH (nf:NotaFiscal)
                 WHERE nf.status IS NOT NULL AND nf.dataEmissao >= $start AND nf.dataEmissao <= $end
                 RETURN count(nf) AS totalNFs, sum(coalesce(nf.valorTotal, 0)) AS valorTotal`,
                { start, end: end + '￿' }, // ￿ ensures dataEmissao with time is included
            );
            const r = res.records[0];
            return { totalNFs: toNum(r?.get('totalNFs')), valorTotal: toNum(r?.get('valorTotal')) };
        };

        // Sequential: a single session does not allow concurrent queries (the
        // Neo4j driver serializes per session — Promise.all here would error).
        const current = await sumPeriod(dataInicio, dataFim);
        const previous = await sumPeriod(prevStart, prevEnd);
        const yearAgo = await sumPeriod(yoyStart, yoyEnd);

        return {
            current,
            previous,
            yearAgo,
            changeVsPrevious: {
                totalNFs: frac(current.totalNFs, previous.totalNFs),
                valorTotal: frac(current.valorTotal, previous.valorTotal),
            },
            changeVsYearAgo: {
                totalNFs: frac(current.totalNFs, yearAgo.totalNFs),
                valorTotal: frac(current.valorTotal, yearAgo.valorTotal),
            },
        };
    } finally {
        await session.close();
    }
}

/** A group of NF-e suspected of being duplicates (same issuer, date and value). */
export interface DuplicateGroup {
    cnpjEmitente: string;
    razaoSocial: string;
    dataEmissao: string; // date (YYYY-MM-DD) shared by the group
    valorTotal: number;
    count: number; // how many NF-e fall in this group (>= 2)
    chaves: string[]; // access keys of the NF-e in the group
}

/**
 * Detects likely-duplicate NF-e: same issuer + same emission DATE + same total
 * value, appearing 2+ times. This is a business heuristic — NOT the access-key
 * dedup (that already happens at MERGE). Returns up to `limit` groups, most
 * duplicated first. Ignores devoluções (a return legitimately mirrors a sale).
 */
export async function findDuplicateInvoices(driver: Driver, limit = 50): Promise<DuplicateGroup[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)
             WHERE nf.status IS NOT NULL AND coalesce(nf.finalidade, '') <> 'devolucao'
             WITH emit, substring(nf.dataEmissao, 0, 10) AS dia, nf.valorTotal AS valor,
                  collect(nf.chaveAcesso) AS chaves
             WHERE size(chaves) >= 2
             RETURN emit.cnpj AS cnpjEmitente, emit.razaoSocial AS razaoSocial,
                    dia AS dataEmissao, valor AS valorTotal, size(chaves) AS count, chaves
             ORDER BY count DESC, valorTotal DESC
             LIMIT $limit`,
            { limit: neo4jInt(limit) },
        );
        return res.records.map((r) => ({
            cnpjEmitente: String(r.get('cnpjEmitente') ?? ''),
            razaoSocial: String(r.get('razaoSocial') ?? ''),
            dataEmissao: String(r.get('dataEmissao') ?? ''),
            valorTotal: toNum(r.get('valorTotal')),
            count: toNum(r.get('count')),
            chaves: (r.get('chaves') as string[]) ?? [],
        }));
    } finally {
        await session.close();
    }
}

/** A gap in an issuer's NF-e numbering sequence (a possible missing invoice). */
export interface NumberingGap {
    cnpjEmitente: string;
    razaoSocial: string;
    serie: string;
    from: number; // last present number before the gap
    to: number; // next present number after the gap
    missing: number; // how many numbers are missing between them
}

/**
 * Detects gaps in NF-e numbering per issuer+série: numeric nNF sorted ascending;
 * any jump > 1 between consecutive numbers is a gap (possible missing/unimported
 * NF-e). Non-numeric nNF are ignored. Returns up to `limit` gaps, largest first.
 */
export async function findNumberingGaps(driver: Driver, limit = 50): Promise<NumberingGap[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)
             WHERE nf.status IS NOT NULL AND nf.numero =~ '\\\\d+'
             WITH emit, coalesce(nf.serie, '') AS serie, toInteger(nf.numero) AS num
             ORDER BY num ASC
             WITH emit, serie, collect(num) AS nums
             WHERE size(nums) >= 2
             UNWIND range(0, size(nums) - 2) AS i
             WITH emit, serie, nums[i] AS a, nums[i + 1] AS b
             WHERE b - a > 1
             RETURN emit.cnpj AS cnpjEmitente, emit.razaoSocial AS razaoSocial, serie,
                    a AS \`from\`, b AS \`to\`, (b - a - 1) AS missing
             ORDER BY missing DESC
             LIMIT $limit`,
            { limit: neo4jInt(limit) },
        );
        return res.records.map((r) => ({
            cnpjEmitente: String(r.get('cnpjEmitente') ?? ''),
            razaoSocial: String(r.get('razaoSocial') ?? ''),
            serie: String(r.get('serie') ?? ''),
            from: toNum(r.get('from')),
            to: toNum(r.get('to')),
            missing: toNum(r.get('missing')),
        }));
    } finally {
        await session.close();
    }
}
