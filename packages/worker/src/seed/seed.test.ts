import { describe, it, expect, vi } from 'vitest';
import type { Driver } from 'neo4j-driver';

// Mocka graph: getDriver não usado (injetamos), runMigrations é no-op.
vi.mock('@notagrafo/graph', () => ({ getDriver: vi.fn(), runMigrations: vi.fn(async () => {}) }));

import { runSeed } from './index.js';
import type { XmlStorage } from '../storage/xml.storage.js';

// driver fake: createDemoUser faz session().run() — devolvemos uma sessão no-op.
const fakeDriver = { session: () => ({ run: async () => ({ records: [] }), close: async () => {} }) } as unknown as Driver;
const fakeStorage = {} as XmlStorage;

describe('runSeed (unit)', () => {
    it('caminho feliz: todas processadas, sem erros reportados', async () => {
        const processFn = vi.fn(async () => undefined);
        const r = await runSeed({ count: 3, seed: 1 }, { driver: fakeDriver, storage: fakeStorage, processFn });
        expect(r.geradas).toBe(3);
        expect(r.processadas).toBe(3);
        expect(r.falhas).toBe(0);
        expect(r.primeiroErro).toBeNull();
        expect(r.errosPorTipo).toEqual({});
        expect(processFn).toHaveBeenCalledTimes(3);
    });

    it('emite ao menos uma devolução (finNFe=4 com NFref) num lote >= 14', async () => {
        const xmls: string[] = [];
        const processFn = vi.fn(async (data: { xml: string }) => {
            xmls.push(data.xml);
        });
        const r = await runSeed({ count: 14, seed: 1 }, { driver: fakeDriver, storage: fakeStorage, processFn });
        expect(r.processadas).toBe(14);
        // i=14 cai na regra (i>7 && i%7===0) → uma devolução referenciando uma venda anterior
        const devolucoes = xmls.filter((x) => /<finNFe>4<\/finNFe>/.test(x) && /<refNFe>/.test(x));
        expect(devolucoes.length).toBeGreaterThanOrEqual(1);
    });

    it('reporta primeiroErro e agrega errosPorTipo sem engolir', async () => {
        let i = 0;
        const processFn = vi.fn(async () => {
            i++;
            if (i % 2 === 0) throw new TypeError(`boom #${i}`);
        });
        const r = await runSeed({ count: 4, seed: 1 }, { driver: fakeDriver, storage: fakeStorage, processFn });
        expect(r.processadas).toBe(2);
        expect(r.falhas).toBe(2);
        expect(r.primeiroErro).toBe('boom #2');
        expect(r.errosPorTipo).toEqual({ TypeError: 2 });
    });
});
