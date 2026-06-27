import { describe, it, expect, vi } from 'vitest';
import type { Driver } from 'neo4j-driver';
import { ExportService } from './export.service.js';

// Driver fake: o teste de TTL não chega a executar query (forçamos o job a ready).
const fakeDriver = {} as Driver;

/**
 * Driver fake controlável: a 1ª query (count) resolve na hora; a 2ª (1ª página)
 * fica pendente até `liberarPagina()` ser chamada — permite inspecionar o estado
 * 'processing' do job antes de ele virar 'ready'.
 */
function makeControllableDriver(total: number, registros: Record<string, unknown>[]) {
    let liberar!: () => void;
    const paginaLiberada = new Promise<void>((r) => (liberar = r));
    let chamada = 0;
    const run = vi.fn(async (cypher: string) => {
        chamada++;
        if (cypher.includes('count(DISTINCT nf)')) {
            return { records: [{ get: () => total }] };
        }
        // primeira página: espera a liberação; retorna todos os registros e sem nextCursor
        if (chamada === 2) await paginaLiberada;
        return {
            records: registros.map((nf) => ({
                get: (k: string) => (k === 'nf' ? { properties: nf } : null),
            })),
        };
    });
    const session = () => ({ run, close: vi.fn(async () => {}) });
    return { driver: { session } as unknown as Driver, liberar };
}

describe('ExportService — TTL/expiração', () => {
    it('um export já pronto além do TTL retorna "expired" (→ 410)', async () => {
        const service = new ExportService(fakeDriver, 0); // TTL 0h
        const job = service.criar('csv');
        // força o estado ready com expiresAt no passado
        Object.assign(job, { status: 'ready', expiresAt: Date.now() - 1000, filePath: undefined });

        const r = await service.obter(job.exportId);
        expect(r).toBe('expired');

        // após expirar, o job é removido → 404 (null)
        expect(await service.obter(job.exportId)).toBeNull();
    });

    it('contentType mapeia o formato', () => {
        const service = new ExportService(fakeDriver);
        expect(service.contentType('csv')).toContain('text/csv');
        expect(service.contentType('json')).toContain('application/json');
        expect(service.contentType('xlsx')).toContain('spreadsheetml');
    });

    it('estado processing expõe progresso e total; ready zera para totalRegistros', async () => {
        const registros = [{ chaveAcesso: 'a' }, { chaveAcesso: 'b' }, { chaveAcesso: 'c' }];
        const { driver, liberar } = makeControllableDriver(3, registros);
        const service = new ExportService(driver);

        const job = service.criar('json');

        // aguarda o job sair de queued e o count rodar (total definido) — ainda processing
        await vi.waitFor(() => {
            expect(job.status).toBe('processing');
            expect(job.total).toBe(3);
        });

        // libera a página → conclui
        liberar();
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        expect(job.totalRegistros).toBe(3);
        expect(job.progresso).toBe(3);
    });
});
