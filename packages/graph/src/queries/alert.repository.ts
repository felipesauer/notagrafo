import { randomUUID } from 'node:crypto';
import neo4j, { type Driver } from 'neo4j-driver';
import { type Alert, type AlertConfig, type AlertSeverity, type AlertType, mergeAlertConfig } from './alert.rules.js';

/** Neo4j integer for LIMIT params (the driver requires an integer, not a float). */
const neo4jInt = (n: number) => neo4j.int(Math.trunc(n));

/**
 * Persistence of alerts (EPIC-27). Alerts are :Alert nodes keyed by a stable
 * fingerprint so re-evaluation upserts instead of duplicating, preserving the
 * read/unread state. The global alert config is a single :AlertConfig node.
 * Code names in English; fiscal domain terms stay in PT.
 */

const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'toNumber' in v) return (v as { toNumber(): number }).toNumber();
    return Number(v ?? 0);
};

/** A persisted alert (as returned to the API). */
export interface StoredAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    fingerprint: string;
    message: string;
    refs: Alert['refs'];
    data: Record<string, number | string>;
    read: boolean;
    createdAt: string; // ISO
}

/**
 * Upserts the given alerts by fingerprint. New fingerprints are inserted as
 * unread; existing ones keep their id/createdAt/read but refresh message/data.
 * Fingerprints that are no longer produced are deleted (they no longer hold).
 * Returns the number of alerts currently stored after the sync.
 */
export async function syncAlerts(driver: Driver, alerts: Alert[], nowIso: string): Promise<number> {
    const session = driver.session();
    try {
        const rows = alerts.map((a) => ({
            id: randomUUID(),
            type: a.type,
            severity: a.severity,
            fingerprint: a.fingerprint,
            message: a.message,
            // Neo4j stores scalars/arrays, not maps — JSON-encode refs/data.
            refs: JSON.stringify(a.refs),
            data: JSON.stringify(a.data),
            createdAt: nowIso,
        }));
        const fingerprints = rows.map((r) => r.fingerprint);

        // Delete alerts that are no longer produced by any rule.
        await session.run(
            `MATCH (a:Alert) WHERE NOT a.fingerprint IN $fingerprints DETACH DELETE a`,
            { fingerprints },
        );

        // Upsert: ON CREATE seeds id/createdAt/read; ON MATCH refreshes payload.
        await session.run(
            `UNWIND $rows AS row
             MERGE (a:Alert {fingerprint: row.fingerprint})
             ON CREATE SET a.id = row.id, a.createdAt = row.createdAt, a.read = false
             SET a.type = row.type, a.severity = row.severity,
                 a.message = row.message, a.refs = row.refs, a.data = row.data`,
            { rows },
        );

        const res = await session.run(`MATCH (a:Alert) RETURN count(a) AS total`);
        return toNum(res.records[0]?.get('total'));
    } finally {
        await session.close();
    }
}

function mapAlert(props: Record<string, unknown>): StoredAlert {
    const parse = <T>(v: unknown, fallback: T): T => {
        if (typeof v !== 'string') return fallback;
        try {
            return JSON.parse(v) as T;
        } catch {
            return fallback;
        }
    };
    return {
        id: String(props.id ?? ''),
        type: props.type as AlertType,
        severity: props.severity as AlertSeverity,
        fingerprint: String(props.fingerprint ?? ''),
        message: String(props.message ?? ''),
        refs: parse(props.refs, {} as Alert['refs']),
        data: parse(props.data, {} as Record<string, number | string>),
        read: props.read === true,
        createdAt: String(props.createdAt ?? ''),
    };
}

export interface ListAlertsOptions {
    read?: boolean; // filter by read state (omit = all)
    severity?: AlertSeverity;
    limit?: number;
}

/** Lists stored alerts, most severe then most recent first. */
export async function listAlerts(driver: Driver, opts: ListAlertsOptions = {}): Promise<StoredAlert[]> {
    const session = driver.session();
    try {
        const where: string[] = [];
        const params: Record<string, unknown> = { limit: neo4jInt(opts.limit ?? 100) };
        if (opts.read !== undefined) (where.push('a.read = $read'), (params.read = opts.read));
        if (opts.severity) (where.push('a.severity = $severity'), (params.severity = opts.severity));
        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        // Sort critical > warning > info, then newest first.
        const res = await session.run(
            `MATCH (a:Alert) ${whereClause}
             WITH a, CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END AS sev
             RETURN a ORDER BY sev ASC, a.createdAt DESC
             LIMIT $limit`,
            params,
        );
        return res.records.map((r) => mapAlert((r.get('a') as { properties: Record<string, unknown> }).properties));
    } finally {
        await session.close();
    }
}

/** Count of unread alerts (for the topbar badge). */
export async function countUnreadAlerts(driver: Driver): Promise<number> {
    const session = driver.session();
    try {
        const res = await session.run(`MATCH (a:Alert) WHERE a.read = false RETURN count(a) AS total`);
        return toNum(res.records[0]?.get('total'));
    } finally {
        await session.close();
    }
}

/** Marks one alert as read. Returns true if the alert existed. */
export async function markAlertRead(driver: Driver, id: string, read = true): Promise<boolean> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (a:Alert {id: $id}) SET a.read = $read RETURN a.id AS id`,
            { id, read },
        );
        return res.records.length > 0;
    } finally {
        await session.close();
    }
}

/** Marks every alert as read. Returns how many were affected. */
export async function markAllAlertsRead(driver: Driver): Promise<number> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (a:Alert) WHERE a.read = false SET a.read = true RETURN count(a) AS total`,
        );
        return toNum(res.records[0]?.get('total'));
    } finally {
        await session.close();
    }
}

// ── Global alert config (singleton :AlertConfig node) ─────────────────

/** Reads the global alert config, falling back to defaults for missing keys. */
export async function getAlertConfig(driver: Driver): Promise<AlertConfig> {
    const session = driver.session();
    try {
        const res = await session.run(`MATCH (c:AlertConfig {id: 'global'}) RETURN c.json AS json`);
        const raw = res.records[0]?.get('json');
        if (typeof raw !== 'string') return mergeAlertConfig(null);
        try {
            return mergeAlertConfig(JSON.parse(raw) as Partial<AlertConfig>);
        } catch {
            return mergeAlertConfig(null);
        }
    } finally {
        await session.close();
    }
}

/** Persists the global alert config (merged over defaults) and returns it. */
export async function saveAlertConfig(driver: Driver, partial: Partial<AlertConfig>): Promise<AlertConfig> {
    const merged = mergeAlertConfig(partial);
    const session = driver.session();
    try {
        await session.run(
            `MERGE (c:AlertConfig {id: 'global'}) SET c.json = $json`,
            { json: JSON.stringify(merged) },
        );
        return merged;
    } finally {
        await session.close();
    }
}
