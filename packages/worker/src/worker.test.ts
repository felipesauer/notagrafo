import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Redis } from 'ioredis';
import type { Driver } from 'neo4j-driver';
import type { Worker, Queue } from 'bullmq';

// Mocka o fechamento do driver do grafo (vi.hoisted: içado ao topo).
const { closeDriver } = vi.hoisted(() => ({ closeDriver: vi.fn(async (): Promise<void> => {}) }));
vi.mock('@notagrafo/graph', () => ({ closeDriver }));

import { shutdownWorker, registerShutdownHandlers, handleFailedJob, type WorkerHandle, type FailedJobLike } from './worker.js';
import { NF_DLQ } from './queue/config.js';
import type { DeadLetterJobData } from './queue/dlq.js';

function fakeHandle(): {
    handle: WorkerHandle;
    workerClose: ReturnType<typeof vi.fn>;
    dlqClose: ReturnType<typeof vi.fn>;
    connQuit: ReturnType<typeof vi.fn>;
} {
    const workerClose = vi.fn(async () => {});
    const dlqClose = vi.fn(async () => {});
    const connQuit = vi.fn(async () => 'OK');
    const handle: WorkerHandle = {
        worker: { close: workerClose } as unknown as Worker,
        connection: { quit: connQuit } as unknown as Redis,
        driver: {} as Driver,
        dlq: { close: dlqClose } as unknown as Queue<DeadLetterJobData>,
    };
    return { handle, workerClose, dlqClose, connQuit };
}

/** Fila DLQ falsa que registra os add()s. */
function fakeDLQ(): { dlq: Queue<DeadLetterJobData>; add: ReturnType<typeof vi.fn> } {
    const add = vi.fn(async () => ({}));
    return { dlq: { add } as unknown as Queue<DeadLetterJobData>, add };
}

beforeEach(() => closeDriver.mockClear());

describe('shutdownWorker', () => {
    it('fecha worker, DLQ, conexão Redis e driver Neo4j na ordem correta', async () => {
        const { handle, workerClose, dlqClose, connQuit } = fakeHandle();
        await shutdownWorker(handle);
        expect(workerClose).toHaveBeenCalledOnce();
        expect(dlqClose).toHaveBeenCalledOnce();
        expect(connQuit).toHaveBeenCalledOnce();
        expect(closeDriver).toHaveBeenCalledOnce();
        // worker.close antes de quit da conexão (não corta job ativo à força).
        expect(workerClose.mock.invocationCallOrder[0]!).toBeLessThan(connQuit.mock.invocationCallOrder[0]!);
    });
});

describe('handleFailedJob (DLQ)', () => {
    const baseJob = (over: Partial<FailedJobLike> = {}): FailedJobLike => ({
        id: '35200114200166000187550010000000071234567890',
        data: { xml: '<NFe/>', origem: 'lote.zip' },
        attemptsMade: 3,
        remove: vi.fn(async () => {}),
        ...over,
    });

    it('move o job para a DLQ e o remove da fila principal quando esgota as tentativas', async () => {
        const { dlq, add } = fakeDLQ();
        const job = baseJob({ attemptsMade: 3 });
        await handleFailedJob(dlq, 3, job, new Error('boom'));
        expect(add).toHaveBeenCalledOnce();
        const [nome, payload, opts] = add.mock.calls[0]!;
        expect(nome).toBe('dead-letter');
        expect(payload).toMatchObject({ jobId: job.id, erro: 'boom', tentativas: 3, origem: 'lote.zip', original: job.data });
        expect(opts).toMatchObject({ jobId: `dlq:${job.id}` });
        expect(job.remove).toHaveBeenCalledOnce();
    });

    it('NÃO move para a DLQ enquanto ainda há tentativas restantes', async () => {
        const { dlq, add } = fakeDLQ();
        const job = baseJob({ attemptsMade: 1 });
        await handleFailedJob(dlq, 3, job, new Error('transitório'));
        expect(add).not.toHaveBeenCalled();
        expect(job.remove).not.toHaveBeenCalled();
    });

    it('usa o nome de DLQ configurado', () => {
        expect(NF_DLQ).toBe('nf-processing-dlq');
    });
});

describe('registerShutdownHandlers', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((): never => undefined as never));
    afterEach(() => {
        exitSpy.mockClear();
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
    });

    it('SIGTERM dispara shutdown gracioso e sai com código 0', async () => {
        const { handle, workerClose } = fakeHandle();
        registerShutdownHandlers(handle);
        process.emit('SIGTERM');
        // aguarda a cadeia de promessas do shutdown
        await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
        expect(workerClose).toHaveBeenCalledOnce();
    });

    it('segundo sinal força saída imediata com código 1', async () => {
        const { handle } = fakeHandle();
        registerShutdownHandlers(handle);
        // Reassina para o segundo sinal (o handler usa process.once por sinal).
        process.emit('SIGINT');
        process.emit('SIGINT');
        await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
    });
});
