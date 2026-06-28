import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Driver } from 'neo4j-driver';
import type { Queue } from 'bullmq';

// Mocka a consulta de duplicata no grafo (vi.hoisted: o factory é içado ao topo).
const { getNotaFiscal } = vi.hoisted(() => ({ getNotaFiscal: vi.fn() }));
vi.mock('@notagrafo/graph', () => ({ getNotaFiscal }));

import { enqueueNFe, NotaFiscalDuplicadaError } from './nf.queue.js';
import { workerConfigFromEnv, defaultJobOptions, NF_QUEUE } from './config.js';
import type { ProcessNFeJobData } from '../jobs/process-nfe.job.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const xml = readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');
const CHAVE = '35200114200166000187550010000000071234567890';
const fakeDriver = {} as Driver;

beforeEach(() => getNotaFiscal.mockReset());

describe('config (unit)', () => {
    it('workerConfigFromEnv usa defaults e respeita o ambiente', () => {
        expect(workerConfigFromEnv({})).toEqual({ concurrency: 4, maxRetries: 3, backoffDelay: 5000 });
        expect(workerConfigFromEnv({ WORKER_CONCURRENCY: '8', JOB_MAX_RETRIES: '5', JOB_BACKOFF_DELAY: '1000' })).toEqual({
            concurrency: 8,
            maxRetries: 5,
            backoffDelay: 1000,
        });
    });

    it('defaultJobOptions deriva attempts e backoff do config', () => {
        const opts = defaultJobOptions({ concurrency: 4, maxRetries: 5, backoffDelay: 2000 });
        expect(opts.attempts).toBe(5);
        expect(opts.backoff).toEqual({ type: 'exponential', delay: 2000 });
        expect(opts.removeOnFail).toBe(false);
    });
});

describe('enqueueNFe (unit)', () => {
    it('enfileira com jobId = chaveAcesso quando a NF não existe', async () => {
        getNotaFiscal.mockResolvedValue(null);
        const add = vi.fn(async () => ({ id: CHAVE }));
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
        getNotaFiscal.mockResolvedValue({ chaveAcesso: CHAVE });
        const add = vi.fn();
        const queue = { add } as unknown as Queue<ProcessNFeJobData>;
        await expect(enqueueNFe(queue, fakeDriver, xml)).rejects.toBeInstanceOf(NotaFiscalDuplicadaError);
        expect(add).not.toHaveBeenCalled();
    });
});
