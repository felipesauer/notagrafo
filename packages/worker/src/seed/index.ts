import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Driver } from 'neo4j-driver';
import { getDriver, runMigrations } from '@notagrafo/graph';
import { processNFe } from '../jobs/process-nfe.job.js';
import { createXmlStorage } from '../storage/factory.js';
import type { XmlStorage } from '../storage/xml.storage.js';
import { generateNFe, makeRng } from './generator.js';

/** Cria (idempotente) o usuário de demonstração usado no login do profile demo. */
async function createDemoUser(driver: Driver): Promise<void> {
    const email = process.env.DEMO_USER_EMAIL ?? 'demo@notagrafo.local';
    const password = process.env.DEMO_USER_SENHA ?? 'demo1234';
    const senhaHash = await bcrypt.hash(password, 10);
    const session = driver.session();
    try {
        await session.run(
            `MERGE (u:Usuario {email: $email})
             ON CREATE SET u.id = $id, u.nome = $nome, u.senhaHash = $senhaHash, u.criadoEm = $criadoEm`,
            { email, id: randomUUID(), nome: 'Demo', senhaHash, criadoEm: new Date().toISOString() },
        );
    } finally {
        await session.close();
    }
}

export interface SeedOptions {
    count: number;
    seed?: number;
}

/** Dependências injetáveis (testes). Em produção, derivadas do ambiente. */
export interface SeedDeps {
    driver?: Driver;
    storage?: XmlStorage;
    processFn?: (data: { xml: string; origem?: string }, deps: { driver: Driver; storage: XmlStorage }) => Promise<unknown>;
}

export interface SeedResult {
    geradas: number;
    processadas: number;
    falhas: number;
    /** Mensagem do primeiro erro observado (null se não houve falha). */
    primeiroErro: string | null;
    /** Contagem de falhas agrupada por nome do erro (ex.: { Error: 3 }). */
    errosPorTipo: Record<string, number>;
}

/**
 * Gera `count` NFes fictícias e as processa pelo pipeline normal (validação XSD
 * → parse → grafo → storage), populando o grafo. Reproduzível pelo `seed`.
 */
export async function runSeed(opts: SeedOptions, deps: SeedDeps = {}): Promise<SeedResult> {
    const rng = makeRng(opts.seed ?? 42);
    const driver = deps.driver ?? getDriver();
    const storage = deps.storage ?? createXmlStorage();
    const processFn = deps.processFn ?? processNFe;
    await runMigrations(driver);

    // Usuário de demonstração para o login (e2e / exploração do profile demo).
    // MERGE por e-mail → idempotente. Senha via bcrypt; não importa a API (evita ciclo).
    await createDemoUser(driver);

    let processadas = 0;
    let falhas = 0;
    let primeiroErro: string | null = null;
    const errosPorTipo: Record<string, number> = {};
    // Chaves de vendas já emitidas — alvo das devoluções (aresta DEVOLVE).
    const chavesVenda: string[] = [];
    for (let i = 1; i <= opts.count; i++) {
        // A cada 7 notas (a partir da 8ª), emite uma devolução de uma venda anterior.
        const ehDevolucao = i > 7 && i % 7 === 0 && chavesVenda.length > 0;
        const ref = ehDevolucao ? chavesVenda[Math.floor(rng() * chavesVenda.length)]! : undefined;
        const { xml, chaveAcesso } = generateNFe(i, rng, ref ? { devolucaoRef: ref } : {});
        if (!ehDevolucao) chavesVenda.push(chaveAcesso);
        try {
            await processFn({ xml, origem: 'demo-seed' }, { driver, storage });
            processadas++;
        } catch (err) {
            falhas++;
            const e = err as Error;
            const tipo = e?.name ?? 'Error';
            errosPorTipo[tipo] = (errosPorTipo[tipo] ?? 0) + 1;
            if (primeiroErro === null) {
                primeiroErro = e?.message ?? String(err);
                // Loga o primeiro erro com stack para diagnóstico (não engole).
                // eslint-disable-next-line no-console
                console.error(`[seed] falha na NFe #${i}:`, err);
            }
        }
    }

    return { geradas: opts.count, processadas, falhas, primeiroErro, errosPorTipo };
}

// Entry point do serviço `seed` (profile demo). Roda uma vez e encerra.
if (process.argv[1] && /seed[/\\]index\.(js|ts)$/.test(process.argv[1])) {
    if (process.env.DEMO !== 'true') {
        // eslint-disable-next-line no-console
        console.error('[seed] DEMO != true — nada a fazer.');
        process.exit(0);
    }
    const count = Number(process.env.DEMO_NF_COUNT ?? '500');
    runSeed({ count })
        .then((r) => {
            // eslint-disable-next-line no-console
            console.warn(`[seed] ${r.processadas}/${r.geradas} NFes processadas (${r.falhas} falhas).`);
            if (r.falhas > 0) {
                const resumo = Object.entries(r.errosPorTipo)
                    .map(([tipo, n]) => `${tipo}: ${n}`)
                    .join(', ');
                // eslint-disable-next-line no-console
                console.error(`[seed] falhas por tipo → ${resumo}. Primeiro erro: ${r.primeiroErro}`);
            }
            process.exit(r.falhas > 0 ? 1 : 0);
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[seed] erro:', err);
            process.exit(1);
        });
}
