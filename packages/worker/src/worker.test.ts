import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Redis } from 'ioredis';
import type { Driver } from 'neo4j-driver';
import type { Worker } from 'bullmq';

// Mocka o fechamento do driver do grafo (vi.hoisted: içado ao topo).
const { closeDriver } = vi.hoisted(() => ({ closeDriver: vi.fn(async (): Promise<void> => {}) }));
vi.mock('@notagrafo/graph', () => ({ closeDriver }));

import { shutdownWorker, registerShutdownHandlers, type WorkerHandle } from './worker.js';

function fakeHandle(): {
    handle: WorkerHandle;
    workerClose: ReturnType<typeof vi.fn>;
    connQuit: ReturnType<typeof vi.fn>;
} {
    const workerClose = vi.fn(async () => {});
    const connQuit = vi.fn(async () => 'OK');
    const handle: WorkerHandle = {
        worker: { close: workerClose } as unknown as Worker,
        connection: { quit: connQuit } as unknown as Redis,
        driver: {} as Driver,
    };
    return { handle, workerClose, connQuit };
}

beforeEach(() => closeDriver.mockClear());

describe('shutdownWorker', () => {
    it('fecha worker, conexão Redis e driver Neo4j na ordem correta', async () => {
        const { handle, workerClose, connQuit } = fakeHandle();
        await shutdownWorker(handle);
        expect(workerClose).toHaveBeenCalledOnce();
        expect(connQuit).toHaveBeenCalledOnce();
        expect(closeDriver).toHaveBeenCalledOnce();
        // worker.close antes de quit da conexão (não corta job ativo à força).
        expect(workerClose.mock.invocationCallOrder[0]).toBeLessThan(connQuit.mock.invocationCallOrder[0]);
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
