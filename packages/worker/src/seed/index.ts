import { getDriver, runMigrations } from '@notagrafo/graph';
import { processNFe } from '../jobs/process-nfe.job.js';
import { createXmlStorage } from '../storage/factory.js';
import { gerarNFe, makeRng } from './generator.js';

export interface SeedOptions {
    count: number;
    seed?: number;
}

export interface SeedResult {
    geradas: number;
    processadas: number;
    falhas: number;
}

/**
 * Gera `count` NFes fictícias e as processa pelo pipeline normal (validação XSD
 * → parse → grafo → storage), populando o grafo. Reproduzível pelo `seed`.
 */
export async function runSeed(opts: SeedOptions): Promise<SeedResult> {
    const rng = makeRng(opts.seed ?? 42);
    const driver = getDriver();
    const storage = createXmlStorage();
    await runMigrations(driver);

    let processadas = 0;
    let falhas = 0;
    for (let i = 1; i <= opts.count; i++) {
        const { xml } = gerarNFe(i, rng);
        try {
            await processNFe({ xml, origem: 'demo-seed' }, { driver, storage });
            processadas++;
        } catch {
            falhas++;
        }
    }

    return { geradas: opts.count, processadas, falhas };
}

// Entry point do serviço `seed` (profile demo). Roda uma vez e encerra.
if (process.argv[1] && process.argv[1].endsWith('seed/index.js')) {
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
            process.exit(r.falhas > 0 ? 1 : 0);
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[seed] erro:', err);
            process.exit(1);
        });
}
