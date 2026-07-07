import type { Driver } from 'neo4j-driver';

/**
 * Constraints de unicidade e índices do grafo (seção 3 do 01 schema dados.md).
 * Todos com IF NOT EXISTS — idempotentes, seguros para múltiplos containers.
 */
export const MIGRATIONS: readonly string[] = [
    // ── Constraints de unicidade ──────────────────────────────────
    'CREATE CONSTRAINT empresa_cnpj_unique IF NOT EXISTS FOR (e:Empresa) REQUIRE e.cnpj IS UNIQUE',
    'CREATE CONSTRAINT nf_chave_unique IF NOT EXISTS FOR (n:NotaFiscal) REQUIRE n.chaveAcesso IS UNIQUE',
    'CREATE CONSTRAINT produto_idUnico_unique IF NOT EXISTS FOR (p:Produto) REQUIRE p.idUnico IS UNIQUE',
    'CREATE CONSTRAINT cfop_codigo_unique IF NOT EXISTS FOR (c:CFOP) REQUIRE c.codigo IS UNIQUE',
    'CREATE CONSTRAINT ncm_codigo_unique IF NOT EXISTS FOR (n:NCM) REQUIRE n.codigo IS UNIQUE',
    // Alertas (EPIC-27): id único por alerta; fingerprint identifica o mesmo
    // alerta lógico entre reavaliações (upsert, sem duplicar).
    'CREATE CONSTRAINT alert_id_unique IF NOT EXISTS FOR (a:Alert) REQUIRE a.id IS UNIQUE',
    'CREATE CONSTRAINT alert_fingerprint_unique IF NOT EXISTS FOR (a:Alert) REQUIRE a.fingerprint IS UNIQUE',

    // ── Índices de texto completo para busca ──────────────────────
    'CREATE FULLTEXT INDEX empresa_search IF NOT EXISTS FOR (e:Empresa) ON EACH [e.cnpj, e.razaoSocial, e.nomeFantasia]',
    'CREATE FULLTEXT INDEX nf_search IF NOT EXISTS FOR (n:NotaFiscal) ON EACH [n.chaveAcesso, n.numero]',
    'CREATE FULLTEXT INDEX produto_search IF NOT EXISTS FOR (p:Produto) ON EACH [p.descricao, p.codigo, p.ean]',

    // ── Índices de range para filtros por data e valor ────────────
    'CREATE INDEX nf_dataEmissao IF NOT EXISTS FOR (n:NotaFiscal) ON (n.dataEmissao)',
    'CREATE INDEX nf_status IF NOT EXISTS FOR (n:NotaFiscal) ON (n.status)',
    'CREATE INDEX empresa_uf IF NOT EXISTS FOR (e:Empresa) ON (e.uf)',
    // Alertas: filtrar por lido/não-lido (badge) e ordenar por data.
    'CREATE INDEX alert_read IF NOT EXISTS FOR (a:Alert) ON (a.read)',
    'CREATE INDEX alert_createdAt IF NOT EXISTS FOR (a:Alert) ON (a.createdAt)',
];

/**
 * Aplica todas as constraints e índices no boot da API e do worker.
 * Idempotente: rodar múltiplas vezes não gera erro.
 *
 * Faz retry com backoff: no boot (API/worker/seed) o Neo4j pode ainda não aceitar
 * conexões de aplicação mesmo já tendo passado o healthcheck — em vez de derrubar
 * o processo na 1ª falha, tenta algumas vezes antes de desistir. `attempts` e
 * `delayMs` são parametrizáveis (testes usam valores baixos).
 */
export async function runMigrations(
    driver: Driver,
    opts: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
    const attempts = opts.attempts ?? 10;
    const delayMs = opts.delayMs ?? 3000;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        const session = driver.session();
        try {
            for (const stmt of MIGRATIONS) {
                await session.run(stmt);
            }
            return; // sucesso
        } catch (err) {
            if (attempt === attempts) throw err; // esgotou — propaga o erro real
            // eslint-disable-next-line no-console
            console.warn(`[migrations] tentativa ${attempt}/${attempts} falhou; retry em ${delayMs}ms…`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        } finally {
            await session.close();
        }
    }
}
