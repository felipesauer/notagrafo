import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Driver } from 'neo4j-driver';

// Mocka a gravação no grafo (vi.hoisted: o factory é içado ao topo).
const { mergeNotaFiscal } = vi.hoisted(() => ({ mergeNotaFiscal: vi.fn(async () => {}) }));
vi.mock('@notagrafo/graph', () => ({ mergeNotaFiscal }));

import { processNFe } from './process-nfe.job.js';
import type { XmlStorage } from '../storage/xml.storage.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const xml = (name = 'nfe-valida-v4.00.xml'): string => readFileSync(join(FIXTURES, name), 'utf8');
const CHAVE = '35200114200166000187550010000000071234567890';

const fakeStorage = (): XmlStorage => ({ save: vi.fn(async (chave: string) => `local://${chave}`) }) as unknown as XmlStorage;
const fakeDriver = {} as Driver;

beforeEach(() => mergeNotaFiscal.mockClear());

describe('processNFe (unit)', () => {
    it('valida, parseia, grava no grafo e salva o XML — retorna chave/versão/ref', async () => {
        const storage = fakeStorage();
        const res = await processNFe({ xml: xml() }, { driver: fakeDriver, storage });
        expect(res.chaveAcesso).toBe(CHAVE);
        expect(res.versao).toBe('4.00');
        expect(res.storageRef).toBe(`local://${CHAVE}`);
        // gravou no grafo com o payload (nota + raw)
        expect(mergeNotaFiscal).toHaveBeenCalledTimes(1);
        const payload = mergeNotaFiscal.mock.calls[0]![1] as { raw: { versaoSchema: string } };
        expect(payload.raw.versaoSchema).toBe('4.00');
        // salvou o XML no storage pela chave
        expect(storage.save).toHaveBeenCalledWith(CHAVE, xml());
    });

    it('reporta progresso nos marcos do pipeline (25/50/75/100)', async () => {
        const onProgress = vi.fn(async () => {});
        await processNFe({ xml: xml() }, { driver: fakeDriver, storage: fakeStorage(), onProgress });
        const marcos = onProgress.mock.calls.map((c) => c[0]);
        expect(marcos).toEqual([25, 50, 75, 100]);
    });

    it('XML inválido contra o XSD → lança e não grava no grafo', async () => {
        const storage = fakeStorage();
        await expect(processNFe({ xml: xml('nfe-invalida-schema.xml') }, { driver: fakeDriver, storage })).rejects.toThrow(/XSD|inválido/i);
        expect(mergeNotaFiscal).not.toHaveBeenCalled();
        expect(storage.save).not.toHaveBeenCalled();
    });
});
