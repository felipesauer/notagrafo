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

    it('list() retorna as exportações mais recentes primeiro e omite ready expiradas', async () => {
        const service = new ExportService(driverComRegistros([{ chaveAcesso: 'a', numero: '1' }]));
        const j1 = service.create('json');
        const j2 = service.create('csv');
        await vi.waitFor(() => {
            expect(j1.status).toBe('ready');
            expect(j2.status).toBe('ready');
        });
        // uma ready expirada não deve aparecer na lista
        Object.assign(j1, { expiresAt: Date.now() - 1000 });

        const lista = service.list();
        expect(lista.map((j) => j.exportId)).toEqual([j2.exportId]); // j1 expirada some; j2 (mais recente) fica
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

/**
 * Driver que devolve nós nf/emit/dest separados, como o Cypher real de
 * listInvoices (que lê r.get('emit')/r.get('dest')). Usado para exercitar o
 * achatamento de CNPJ aninhado no export.
 */
function driverComNos(linhas: { nf: Record<string, unknown>; emit?: Record<string, unknown>; dest?: Record<string, unknown> }[]): Driver {
    const run = vi.fn(async (cypher: string) => {
        if (cypher.includes('count(DISTINCT nf)')) return { records: [{ get: () => linhas.length }] };
        return {
            records: linhas.map((l) => ({
                get: (k: string) => {
                    if (k === 'nf') return { properties: l.nf };
                    if (k === 'emit') return l.emit ? { properties: l.emit } : null;
                    if (k === 'dest') return l.dest ? { properties: l.dest } : null;
                    return null;
                },
            })),
        };
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
        const linhas = csv.split('\r\n');
        expect(linhas[0]).toContain('chaveAcesso'); // header com as colunas do NFListItem
        expect(csv).toContain('"tem,vírgula"'); // célula com vírgula entre aspas
    });

    // Regressão do bug: listInvoices devolve o CNPJ ANINHADO (via nós emit/dest),
    // então cnpjEmitente/cnpjDestinatario saíam vazios no export. flattenRow os
    // achata para chave plana. Estes testes usam o shape de nós REAL do Cypher.
    it('preenche cnpjEmitente/cnpjDestinatario a partir dos nós emit/dest (csv)', async () => {
        const service = new ExportService(driverComNos([
            { nf: { chaveAcesso: 'k1', numero: '7' }, emit: { cnpj: '11222333000144', razaoSocial: 'Emit LTDA', uf: 'SP' }, dest: { cnpj: '55666777000188', razaoSocial: 'Dest SA', uf: 'RJ' } },
        ]));
        const job = service.create('csv', undefined, ['chaveAcesso', 'cnpjEmitente', 'cnpjDestinatario']);
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const linhas = (await service.read(job)).toString().split('\r\n');
        expect(linhas[0]).toBe('chaveAcesso,cnpjEmitente,cnpjDestinatario');
        expect(linhas[1]).toBe('k1,11222333000144,55666777000188'); // antes: 'k1,,'
    });

    it('json com nós aninhados exporta cnpjEmitente/cnpjDestinatario preenchidos', async () => {
        const service = new ExportService(driverComNos([
            { nf: { chaveAcesso: 'k1' }, emit: { cnpj: '11222333000144', razaoSocial: 'Emit LTDA', uf: 'SP' }, dest: { cnpj: '55666777000188', razaoSocial: 'Dest SA', uf: 'RJ' } },
        ]));
        const job = service.create('json', undefined, ['cnpjEmitente', 'cnpjDestinatario']);
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const parsed = JSON.parse((await service.read(job)).toString()) as Array<Record<string, unknown>>;
        expect(parsed[0]).toEqual({ cnpjEmitente: '11222333000144', cnpjDestinatario: '55666777000188' });
    });

    it('xlsx prefixa diretiva sep= + BOM para o Excel abrir em colunas', async () => {
        const service = new ExportService(driverComRegistros(registros));
        const job = service.create('xlsx');
        await vi.waitFor(() => expect(job.status).toBe('ready'));
        const out = (await service.read(job)).toString();
        expect(out.startsWith('﻿sep=,\r\n')).toBe(true);
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

    it('job processing órfão no Redis (restart no meio da geração) vira failed, não fica eterno (NOTA-79)', async () => {
        const redis = fakeRedis();
        // Simula o estado deixado por uma instância que morreu gerando: só o Redis
        // tem o job, em status processing; a nova instância nunca o gerou.
        const orfao = {
            exportId: 'exp_orfao123',
            formato: 'json',
            status: 'processing',
            progresso: 5,
            total: 10,
            totalRegistros: 0,
            tamanhoBytes: 0,
            expiresAt: Date.now() + 60_000,
        };
        redis.store.set('export:exp_orfao123', JSON.stringify(orfao));

        const s2 = new ExportService(driverComRegistros(registros), 24, redis);
        const recuperado = await s2.get('exp_orfao123');
        expect(recuperado).not.toBeNull();
        expect(recuperado).not.toBe('expired');
        expect((recuperado as { status: string }).status).toBe('failed');
        expect((recuperado as { erro?: string }).erro).toMatch(/reinício|restart|interromp/i);
        // e o estado terminal foi persistido de volta no Redis
        expect(JSON.parse(redis.store.get('export:exp_orfao123')!).status).toBe('failed');
    });
});
