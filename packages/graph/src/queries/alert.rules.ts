import neo4j, { type Driver } from 'neo4j-driver';
import { findDuplicateInvoices, findNumberingGaps } from './analysis.queries.js';

/** Neo4j integer for LIMIT params (the driver requires an integer, not a float). */
const neo4jInt = (n: number) => neo4j.int(Math.trunc(n));

/**
 * Alert engine (fiscal BI — EPIC-27). Evaluates a set of rules over the data and
 * produces Alerts. On-demand evaluation (no worker job yet — ADR-19). Analysis
 * scope: an alert is informative, it never blocks or fixes. Config is global
 * (one per instance). Code names in English; fiscal domain terms (NF, cnpj,
 * dataEmissao, valorTotal) stay in PT.
 */

const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'toNumber' in v) return (v as { toNumber(): number }).toNumber();
    return Number(v ?? 0);
};

/** The kinds of rule the engine can evaluate. */
export type AlertType =
    | 'high_value' // NF-e above a value threshold
    | 'supplier_concentration' // one issuer concentrates > X% of the total value
    | 'volume_spike' // recent volume deviates strongly from the baseline
    | 'zero_tax' // active NF-e with no tax where tax is expected
    | 'duplicate' // likely-duplicate NF-e (from analysis.queries)
    | 'numbering_gap'; // gap in an issuer's numbering (from analysis.queries)

export type AlertSeverity = 'info' | 'warning' | 'critical';

/** Reference to the entities an alert points at (for drill-through in the UI). */
export interface AlertRefs {
    chaves?: string[]; // NF-e access keys
    cnpjEmitente?: string;
    serie?: string;
}

/** A single alert produced by the engine (before persistence). */
export interface Alert {
    type: AlertType;
    severity: AlertSeverity;
    /** Stable identity of the logical alert across re-evaluations (for upsert). */
    fingerprint: string;
    /** Human-readable message. Kept language-neutral: the UI localizes by type+data. */
    message: string;
    refs: AlertRefs;
    /** Extra structured data for the UI to render (e.g. value, pct). */
    data: Record<string, number | string>;
}

/** Global alert configuration: which rules are on and their thresholds. */
export interface AlertConfig {
    highValue: { enabled: boolean; threshold: number }; // valorTotal (BRL)
    supplierConcentration: { enabled: boolean; threshold: number }; // fraction 0..1
    volumeSpike: { enabled: boolean; threshold: number }; // fraction 0..1 (abs change)
    zeroTax: { enabled: boolean };
    duplicate: { enabled: boolean };
    numberingGap: { enabled: boolean };
}

/** Sensible defaults for a fresh instance. */
export const DEFAULT_ALERT_CONFIG: AlertConfig = {
    highValue: { enabled: true, threshold: 100_000 },
    supplierConcentration: { enabled: true, threshold: 0.25 },
    volumeSpike: { enabled: true, threshold: 0.5 },
    zeroTax: { enabled: true },
    duplicate: { enabled: true },
    numberingGap: { enabled: true },
};

/** Merges a partial config over the defaults (missing keys fall back). */
export function mergeAlertConfig(partial?: Partial<AlertConfig> | null): AlertConfig {
    if (!partial) return DEFAULT_ALERT_CONFIG;
    return {
        highValue: { ...DEFAULT_ALERT_CONFIG.highValue, ...partial.highValue },
        supplierConcentration: { ...DEFAULT_ALERT_CONFIG.supplierConcentration, ...partial.supplierConcentration },
        volumeSpike: { ...DEFAULT_ALERT_CONFIG.volumeSpike, ...partial.volumeSpike },
        zeroTax: { ...DEFAULT_ALERT_CONFIG.zeroTax, ...partial.zeroTax },
        duplicate: { ...DEFAULT_ALERT_CONFIG.duplicate, ...partial.duplicate },
        numberingGap: { ...DEFAULT_ALERT_CONFIG.numberingGap, ...partial.numberingGap },
    };
}

// ── Rule: high-value NF-e ────────────────────────────────────────────
async function ruleHighValue(driver: Driver, threshold: number, limit: number): Promise<Alert[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)
             WHERE nf.status IS NOT NULL AND coalesce(nf.valorTotal, 0) >= $threshold
             RETURN nf.chaveAcesso AS chave, nf.valorTotal AS valorTotal,
                    emit.cnpj AS cnpjEmitente, emit.razaoSocial AS razaoSocial
             ORDER BY nf.valorTotal DESC
             LIMIT $limit`,
            { threshold, limit: neo4jInt(limit) },
        );
        return res.records.map((r): Alert => {
            const chave = String(r.get('chave') ?? '');
            const valorTotal = toNum(r.get('valorTotal'));
            return {
                type: 'high_value',
                severity: 'warning',
                fingerprint: `high_value:${chave}`,
                message: `NF-e de valor elevado: ${brl(valorTotal)}`,
                refs: { chaves: [chave], cnpjEmitente: String(r.get('cnpjEmitente') ?? '') },
                data: { valorTotal, razaoSocial: String(r.get('razaoSocial') ?? '') },
            };
        });
    } finally {
        await session.close();
    }
}

// ── Rule: supplier concentration ─────────────────────────────────────
async function ruleSupplierConcentration(driver: Driver, threshold: number): Promise<Alert[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)
             WHERE nf.status IS NOT NULL
             WITH emit, sum(coalesce(nf.valorTotal, 0)) AS valor
             WITH collect({cnpj: emit.cnpj, razaoSocial: emit.razaoSocial, valor: valor}) AS empresas,
                  sum(valor) AS total
             WHERE total > 0
             UNWIND empresas AS e
             WITH e, total, e.valor / total AS share
             WHERE share >= $threshold
             RETURN e.cnpj AS cnpjEmitente, e.razaoSocial AS razaoSocial, share
             ORDER BY share DESC`,
            { threshold },
        );
        return res.records.map((r): Alert => {
            const cnpj = String(r.get('cnpjEmitente') ?? '');
            const share = toNum(r.get('share'));
            const razaoSocial = String(r.get('razaoSocial') ?? '');
            return {
                type: 'supplier_concentration',
                severity: 'warning',
                fingerprint: `supplier_concentration:${cnpj}`,
                message: `${razaoSocial || cnpj} concentra ${(share * 100).toFixed(0)}% do valor emitido`,
                refs: { cnpjEmitente: cnpj },
                data: { share, razaoSocial },
            };
        });
    } finally {
        await session.close();
    }
}

// ── Rule: volume spike (recent half vs earlier half, monthly series) ──
async function ruleVolumeSpike(driver: Driver, threshold: number): Promise<Alert[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (nf:NotaFiscal)
             WHERE nf.status IS NOT NULL AND nf.dataEmissao IS NOT NULL
             WITH substring(nf.dataEmissao, 0, 7) AS mes, count(nf) AS total
             RETURN mes, total ORDER BY mes ASC`,
        );
        const series = res.records.map((r) => toNum(r.get('total')));
        if (series.length < 4) return [];
        const mid = Math.floor(series.length / 2);
        const a = series.slice(0, mid).reduce((s, v) => s + v, 0);
        const b = series.slice(mid).reduce((s, v) => s + v, 0);
        if (a === 0) return [];
        const change = (b - a) / a;
        if (Math.abs(change) < threshold) return [];
        const up = change > 0;
        return [
            {
                type: 'volume_spike',
                severity: 'info',
                // window count keeps the fingerprint stable within the same dataset
                fingerprint: `volume_spike:${series.length}:${up ? 'up' : 'down'}`,
                message: up
                    ? `Pico de volume: emissões subiram ${(change * 100).toFixed(0)}% no período recente`
                    : `Queda de volume: emissões caíram ${(Math.abs(change) * 100).toFixed(0)}% no período recente`,
                refs: {},
                data: { change },
            },
        ];
    } finally {
        await session.close();
    }
}

// ── Rule: zero-tax active NF-e (no ICMS/IBS where expected) ───────────
async function ruleZeroTax(driver: Driver, limit: number): Promise<Alert[]> {
    const session = driver.session();
    try {
        // Sale (not devolução), with value, but no ICMS and no IBS recorded.
        const res = await session.run(
            `MATCH (emit:Empresa)-[:EMITIU]->(nf:NotaFiscal)
             WHERE nf.status = 'ativa' AND coalesce(nf.finalidade, '') <> 'devolucao'
               AND coalesce(nf.valorTotal, 0) > 0
               AND coalesce(nf.total_vICMS, 0) = 0 AND coalesce(nf.total_vIBS, 0) = 0
             RETURN nf.chaveAcesso AS chave, nf.valorTotal AS valorTotal,
                    emit.cnpj AS cnpjEmitente, emit.razaoSocial AS razaoSocial
             ORDER BY nf.valorTotal DESC
             LIMIT $limit`,
            { limit: neo4jInt(limit) },
        );
        return res.records.map((r): Alert => {
            const chave = String(r.get('chave') ?? '');
            const valorTotal = toNum(r.get('valorTotal'));
            return {
                type: 'zero_tax',
                severity: 'info',
                fingerprint: `zero_tax:${chave}`,
                message: `NF-e ativa de ${brl(valorTotal)} sem ICMS/IBS registrado`,
                refs: { chaves: [chave], cnpjEmitente: String(r.get('cnpjEmitente') ?? '') },
                data: { valorTotal, razaoSocial: String(r.get('razaoSocial') ?? '') },
            };
        });
    } finally {
        await session.close();
    }
}

// ── Rules reusing analysis.queries (duplicates / gaps) ────────────────
async function ruleDuplicates(driver: Driver, limit: number): Promise<Alert[]> {
    const groups = await findDuplicateInvoices(driver, limit);
    return groups.map((g): Alert => ({
        type: 'duplicate',
        severity: 'critical',
        fingerprint: `duplicate:${g.cnpjEmitente}:${g.dataEmissao}:${g.valorTotal}`,
        message: `${g.count} NF-e possivelmente duplicadas (${g.razaoSocial || g.cnpjEmitente}, ${g.dataEmissao})`,
        refs: { chaves: g.chaves, cnpjEmitente: g.cnpjEmitente },
        data: { count: g.count, valorTotal: g.valorTotal, dataEmissao: g.dataEmissao, razaoSocial: g.razaoSocial },
    }));
}

async function ruleNumberingGaps(driver: Driver, limit: number): Promise<Alert[]> {
    const gaps = await findNumberingGaps(driver, limit);
    return gaps.map((g): Alert => ({
        type: 'numbering_gap',
        severity: 'warning',
        fingerprint: `numbering_gap:${g.cnpjEmitente}:${g.serie}:${g.from}:${g.to}`,
        message: `${g.missing} NF-e faltando na numeração (${g.razaoSocial || g.cnpjEmitente}, série ${g.serie || '—'}: ${g.from}→${g.to})`,
        refs: { cnpjEmitente: g.cnpjEmitente, serie: g.serie },
        data: { missing: g.missing, from: g.from, to: g.to, razaoSocial: g.razaoSocial },
    }));
}

const brl = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Evaluates all enabled rules over the current data and returns the produced
 * alerts (not yet persisted). Each rule opens its own session, so they can run
 * concurrently. `perRuleLimit` caps how many alerts each rule may emit.
 */
export async function evaluateAlerts(
    driver: Driver,
    config: AlertConfig = DEFAULT_ALERT_CONFIG,
    perRuleLimit = 20,
): Promise<Alert[]> {
    const tasks: Array<Promise<Alert[]>> = [];
    if (config.highValue.enabled) tasks.push(ruleHighValue(driver, config.highValue.threshold, perRuleLimit));
    if (config.supplierConcentration.enabled)
        tasks.push(ruleSupplierConcentration(driver, config.supplierConcentration.threshold));
    if (config.volumeSpike.enabled) tasks.push(ruleVolumeSpike(driver, config.volumeSpike.threshold));
    if (config.zeroTax.enabled) tasks.push(ruleZeroTax(driver, perRuleLimit));
    if (config.duplicate.enabled) tasks.push(ruleDuplicates(driver, perRuleLimit));
    if (config.numberingGap.enabled) tasks.push(ruleNumberingGaps(driver, perRuleLimit));

    const results = await Promise.all(tasks);
    return results.flat();
}
