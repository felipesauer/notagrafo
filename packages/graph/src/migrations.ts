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

    // ── Índices de texto completo para busca ──────────────────────
    'CREATE FULLTEXT INDEX empresa_search IF NOT EXISTS FOR (e:Empresa) ON EACH [e.cnpj, e.razaoSocial, e.nomeFantasia]',
    'CREATE FULLTEXT INDEX nf_search IF NOT EXISTS FOR (n:NotaFiscal) ON EACH [n.chaveAcesso, n.numero]',
    'CREATE FULLTEXT INDEX produto_search IF NOT EXISTS FOR (p:Produto) ON EACH [p.descricao, p.codigo, p.ean]',

    // ── Índices de range para filtros por data e valor ────────────
    'CREATE INDEX nf_dataEmissao IF NOT EXISTS FOR (n:NotaFiscal) ON (n.dataEmissao)',
    'CREATE INDEX nf_status IF NOT EXISTS FOR (n:NotaFiscal) ON (n.status)',
    'CREATE INDEX empresa_uf IF NOT EXISTS FOR (e:Empresa) ON (e.uf)',
];

/**
 * Aplica todas as constraints e índices no boot da API e do worker.
 * Idempotente: rodar múltiplas vezes não gera erro.
 */
export async function runMigrations(driver: Driver): Promise<void> {
    const session = driver.session();
    try {
        for (const stmt of MIGRATIONS) {
            await session.run(stmt);
        }
    } finally {
        await session.close();
    }
}
