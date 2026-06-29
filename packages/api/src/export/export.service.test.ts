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
        const job = service.create('csv');
        // força o estado ready com expiresAt no passado
        Object.assign(job, { status: 'ready', expiresAt: Date.now() - 1000, filePath: undefined });

        const r = await service.get(job.exportId);
        expect(r).toBe('expired');

        // após expirar, o job é removido → 404 (null)
        expect(await service.get(job.exportId)).toBeNull();
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

        const job = service.create('json');

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

/** Driver simples: count fixo + 1 página de registros + sem nextCursor. */
function driverComRegistros(registros: Record<string, unknown>[]): Driver {
    const run = vi.fn(async (cypher: string) => {
        if (cypher.includes('count(DISTINCT nf)')) return { records: [{ get: () => registros.length }] };
        return { records: registros.map((nf) => ({ get: (k: string) => (k === 'nf' ? { properties: nf } : null) })) };
    });
    return { session: () => ({ run, close: vi.fn(async () => {}) }) } as unknown as Driver;
}

describe('ExportService — serialização', () => {
    // naturezaOp sobrevive ao mapeamento NFListItem como string (testa o escape do CSV).
    const registros = [
        { chaveAcesso: 'a', numero: '1', naturezaOp: 'Venda comum' },
        { chaveAcesso: 'b', numero: '2', naturezaOp: 'tem,vírgula' },
    ];

    it('json (sem campos) inclui as linhas mapeadas e é parseável', async () => {
        const service = new ExportService(driverComRegistros(registros));
        const job = service.create('json');
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const buf = await service.read(job);
        const parsed = JSON.parse(buf.toString()) as Array<Record<string, unknown>>;
        expect(parsed).toHaveLength(2);
        expect(parsed[0]!.chaveAcesso).toBe('a');
    });

    it('json com campos restringe as colunas (pick)', async () => {
        const service = new ExportService(driverComRegistros(registros));
        const job = service.create('json', undefined, ['chaveAcesso']);
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const parsed = JSON.parse((await service.read(job)).toString()) as Array<Record<string, unknown>>;
        expect(Object.keys(parsed[0]!)).toEqual(['chaveAcesso']);
    });

    it('csv escapa células com vírgula e tem header', async () => {
        const service = new ExportService(driverComRegistros(registros));
        const job = service.create('csv');
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const csv = (await service.read(job)).toString();
        const linhas = csv.split('\n');
        expect(linhas[0]).toContain('chaveAcesso'); // header com as colunas do NFListItem
        expect(csv).toContain('"tem,vírgula"'); // célula com vírgula entre aspas
    });

    it('falha na geração marca status failed com erro', async () => {
        const driver = { session: () => ({ run: vi.fn(async () => { throw new Error('Neo4j down'); }), close: vi.fn(async () => {}) }) } as unknown as Driver;
        const service = new ExportService(driver);
        const job = service.create('json');
        await vi.waitFor(() => expect(job.status).toBe('failed'));
        expect(job.erro).toContain('Neo4j down');
    });
});

/** Redis fake em memória que implementa o subconjunto RedisLike. */
function fakeRedis() {
    const store = new Map<string, string>();
    return {
        store,
        set: vi.fn(async (k: string, v: string) => void store.set(k, v)),
        get: vi.fn(async (k: string) => store.get(k) ?? null),
        del: vi.fn(async (k: string) => void store.delete(k)),
    };
}

describe('ExportService — persistência em Redis (NOTA-47)', () => {
    const registros = [{ chaveAcesso: 'a', numero: '1' }];

    it('persiste os metadados no Redis ao criar e ao concluir', async () => {
        const redis = fakeRedis();
        const service = new ExportService(driverComRegistros(registros), 24, redis);
        const job = service.create('json');
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        // gravou no Redis sob a chave export:<id>
        expect(redis.set).toHaveBeenCalled();
        const persistido = JSON.parse(redis.store.get(`export:${job.exportId}`)!);
        expect(persistido.status).toBe('ready');
        expect(persistido.totalRegistros).toBe(1);
    });

    it('recupera o job do Redis após "restart" (nova instância sem o job em memória)', async () => {
        const redis = fakeRedis();
        const s1 = new ExportService(driverComRegistros(registros), 24, redis);
        const job = s1.create('json');
        await vi.waitFor(() => expect(job.status).toBe('ready'));

        // simula restart: nova instância só com o mesmo Redis (memória vazia)
        const s2 = new ExportService(driverComRegistros(registros), 24, redis);
        const recuperado = await s2.get(job.exportId);
        expect(recuperado).not.toBeNull();
        expect(recuperado).not.toBe('expired');
        expect((recuperado as { exportId: string }).exportId).toBe(job.exportId);
        expect((recuperado as { status: string }).status).toBe('ready');
    });

    it('sem Redis, opera só em memória (fallback)', async () => {
        const service = new ExportService(driverComRegistros(registros)); // sem redis
        const job = service.create('json');
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        expect(await service.get(job.exportId)).not.toBeNull();
    });
});
