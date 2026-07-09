import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Driver } from 'neo4j-driver';
import type { Queue } from 'bullmq';

// Mocka a consulta de duplicata no grafo (vi.hoisted: o factory é içado ao topo).
const { getInvoice } = vi.hoisted(() => ({ getInvoice: vi.fn() }));
vi.mock('@notagrafo/graph', () => ({ getInvoice }));

import { enqueueNFe, NotaFiscalDuplicadaError, XmlMuitoGrandeError } from './nf.queue.js';
import { workerConfigFromEnv, defaultJobOptions, NF_QUEUE, DEFAULT_MAX_XML_BYTES } from './config.js';
import type { ProcessNFeJobData } from '../jobs/process-nfe.job.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const xml = readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');
const CHAVE = '35200114200166000187550010000000071234567890';
const fakeDriver = {} as Driver;

beforeEach(() => getInvoice.mockReset());

describe('config (unit)', () => {
    it('workerConfigFromEnv usa defaults e respeita o ambiente', () => {
        expect(workerConfigFromEnv({})).toEqual({ concurrency: 4, maxRetries: 3, backoffDelay: 5000, maxXmlBytes: DEFAULT_MAX_XML_BYTES });
        expect(workerConfigFromEnv({ WORKER_CONCURRENCY: '8', JOB_MAX_RETRIES: '5', JOB_BACKOFF_DELAY: '1000', MAX_XML_BYTES: '1000' })).toEqual({
            concurrency: 8,
            maxRetries: 5,
            backoffDelay: 1000,
            maxXmlBytes: 1000,
        });
    });

    it('defaultJobOptions deriva attempts e backoff do config', () => {
        const opts = defaultJobOptions({ concurrency: 4, maxRetries: 5, backoffDelay: 2000, maxXmlBytes: DEFAULT_MAX_XML_BYTES });
        expect(opts.attempts).toBe(5);
        expect(opts.backoff).toEqual({ type: 'exponential', delay: 2000 });
        expect(opts.removeOnFail).toBe(false);
    });
});

describe('enqueueNFe (unit)', () => {
    it('enfileira com jobId = chaveAcesso quando a NF não existe', async () => {
        getInvoice.mockResolvedValue(null);
        const add = vi.fn(async (_name: string, _data: unknown, _opts?: unknown) => ({ id: CHAVE }));
        const queue = { add, name: NF_QUEUE } as unknown as Queue<ProcessNFeJobData>;

        const res = await enqueueNFe(queue, fakeDriver, xml, { origem: 'lote.xml' });
        expect(res).toEqual({ jobId: CHAVE, chaveAcesso: CHAVE });
        expect(add).toHaveBeenCalledTimes(1);
        const [nome, data, jobOpts] = add.mock.calls[0]!;
        expect(nome).toBe('process-nfe');
        expect((data as ProcessNFeJobData).origem).toBe('lote.xml');
        expect((jobOpts as { jobId: string }).jobId).toBe(CHAVE);
    });

    it('NF já no grafo → NotaFiscalDuplicadaError e não enfileira', async () => {
        getInvoice.mockResolvedValue({ chaveAcesso: CHAVE });
        const add = vi.fn();
        const queue = { add } as unknown as Queue<ProcessNFeJobData>;
        await expect(enqueueNFe(queue, fakeDriver, xml)).rejects.toBeInstanceOf(NotaFiscalDuplicadaError);
        expect(add).not.toHaveBeenCalled();
    });

    it('XML acima do teto → XmlMuitoGrandeError e não enfileira (nem consulta o grafo) — NOTA-209', async () => {
        getInvoice.mockResolvedValue(null);
        const add = vi.fn();
        const queue = { add } as unknown as Queue<ProcessNFeJobData>;
        const config = { concurrency: 4, maxRetries: 3, backoffDelay: 5000, maxXmlBytes: 100 };
        await expect(enqueueNFe(queue, fakeDriver, xml, { config })).rejects.toBeInstanceOf(XmlMuitoGrandeError);
        expect(add).not.toHaveBeenCalled();
        expect(getInvoice).not.toHaveBeenCalled(); // rejeita ANTES de parsear/consultar
    });

    it('XML dentro do teto enfileira normalmente — NOTA-209', async () => {
        getInvoice.mockResolvedValue(null);
        const add = vi.fn(async () => ({ id: CHAVE }));
        const queue = { add, name: NF_QUEUE } as unknown as Queue<ProcessNFeJobData>;
        const config = { concurrency: 4, maxRetries: 3, backoffDelay: 5000, maxXmlBytes: DEFAULT_MAX_XML_BYTES };
        const res = await enqueueNFe(queue, fakeDriver, xml, { config });
        expect(res.chaveAcesso).toBe(CHAVE);
        expect(add).toHaveBeenCalledTimes(1);
    });
});
