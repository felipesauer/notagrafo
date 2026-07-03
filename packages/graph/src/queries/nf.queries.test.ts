import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord, fakeNode } from '../__test-helpers__/fake-driver.js';
import { listInvoices, countInvoices, activeFilters, getInvoice, listEventos } from './nf.queries.js';

const nfNode = (over: Record<string, unknown> = {}) =>
    fakeNode({
        chaveAcesso: '351',
        numero: '7',
        serie: '1',
        dataEmissao: '2026-06-01',
        dataSaida: '2026-06-01',
        valorTotal: 1500,
        status: 'ativa',
        tipoNF: 'saida',
        finalidade: 'normal',
        naturezaOp: 'Venda',
        importadaEm: '2026-06-01T10:00:00Z',
        processadaEm: '2026-06-01T10:01:00Z',
        ...over,
    });
const empNode = (cnpj: string, uf: string) => fakeNode({ cnpj, razaoSocial: `Emp ${cnpj}`, uf });

describe('activeFilters (unit)', () => {
    it('lista apenas chaves preenchidas, ignorando undefined e vazio', () => {
        expect(activeFilters({ status: 'ativa', numero: '', ufEmitente: 'SP' })).toEqual(['status', 'ufEmitente']);
        expect(activeFilters({})).toEqual([]);
    });

    it('inclui os filtros fiscais, inclusive vICMSMin=0 e comImposto=false', () => {
        expect(activeFilters({ vICMSMin: 0, comImposto: false })).toEqual(['vICMSMin', 'comImposto']);
        expect(activeFilters({ vICMSMax: 500 })).toEqual(['vICMSMax']);
    });
});

describe('listInvoices (unit, driver fake)', () => {
    it('mapeia nó/emitente/destinatário e respeita limit (hasMore via N+1)', async () => {
        // pede limit 2 → query usa limit+1=3; devolvemos 3 → hasMore true, 2 itens
        const rows = [
            [nfNode({ chaveAcesso: 'a' }), empNode('111', 'SP'), empNode('222', 'MG')],
            [nfNode({ chaveAcesso: 'b' }), empNode('111', 'SP'), null],
            [nfNode({ chaveAcesso: 'c' }), empNode('111', 'SP'), null],
        ].map(([nf, emit, dest]) => fakeRecord({ nf, emit, dest }));
        const { driver, runs } = makeFakeDriver(() => rows);

        const page = await listInvoices(driver, {}, { limit: 2, orderBy: 'chaveAcesso', order: 'asc' });
        expect(page.data).toHaveLength(2);
        expect(page.hasMore).toBe(true);
        expect(page.limit).toBe(2);
        expect(page.nextCursor).toBeTruthy();
        // mapeamento
        expect(page.data[0]!.emitente).toEqual({ cnpj: '111', razaoSocial: 'Emp 111', uf: 'SP' });
        expect(page.data[0]!.destinatario).toEqual({ cnpj: '222', razaoSocial: 'Emp 222', uf: 'MG' });
        expect(page.data[1]!.destinatario).toBeUndefined();
        // a query pediu limit+1 e ORDER BY asc
        expect(runs[0]!.cypher).toContain('LIMIT $limitPlus1');
        expect(runs[0]!.cypher).toContain('ORDER BY nf.chaveAcesso asc');
    });

    it('orderBy inválido cai no default dataEmissao; sem hasMore quando vem <= limit', async () => {
        const rows = [fakeRecord({ nf: nfNode(), emit: empNode('111', 'SP'), dest: null })];
        const { driver, runs } = makeFakeDriver(() => rows);
        const page = await listInvoices(driver, {}, { limit: 20, orderBy: 'campo_invalido' });
        expect(page.hasMore).toBe(false);
        expect(page.nextCursor).toBeNull();
        expect(runs[0]!.cypher).toContain('ORDER BY nf.dataEmissao');
    });

    it('aplica todos os filtros nos params da query (where + matches)', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await listInvoices(driver, {
            status: 'ativa',
            numero: '7',
            cnpjEmitente: '111',
            ufEmitente: 'SP',
            cnpjDestinatario: '222',
            ufDestinatario: 'MG',
            cfop: '5102',
            ncm: '6109',
            naturezaOp: 'venda',
            valorTotalMin: 100,
            valorTotalMax: 9000,
            dataEmissaoInicio: '2026-01-01',
            dataEmissaoFim: '2026-12-31',
            q: 'nota',
        });
        const { cypher, params } = runs[0]!;
        expect(params).toMatchObject({
            status: 'ativa',
            cnpjEmitente: '111',
            ufEmitente: 'SP',
            cnpjDestinatario: '222',
            ufDestinatario: 'MG',
            cfop: '5102',
            ncm: '6109',
            valorTotalMin: 100,
            valorTotalMax: 9000,
        });
        expect(cypher).toContain('USA_CFOP');
        expect(cypher).toContain('CLASSIFICADO_EM');
        expect(cypher).toContain('CONTAINS');
    });

    it('aplica os filtros fiscais (vICMSMin/Max sobre total_vICMS, comImposto)', async () => {
        const comTrue = makeFakeDriver(() => []);
        await listInvoices(comTrue.driver, { vICMSMin: 100, vICMSMax: 500, comImposto: true });
        expect(comTrue.runs[0]!.cypher).toContain('coalesce(nf.total_vICMS, 0) >= $vICMSMin');
        expect(comTrue.runs[0]!.cypher).toContain('coalesce(nf.total_vICMS, 0) <= $vICMSMax');
        expect(comTrue.runs[0]!.cypher).toContain('coalesce(nf.total_vICMS, 0) > 0');
        expect(comTrue.runs[0]!.params).toMatchObject({ vICMSMin: 100, vICMSMax: 500 });

        const comFalse = makeFakeDriver(() => []);
        await listInvoices(comFalse.driver, { comImposto: false });
        expect(comFalse.runs[0]!.cypher).toContain('coalesce(nf.total_vICMS, 0) = 0');
    });

    it('cursor é round-trip: a 2ª página injeta cursorV/cursorChave nos params', async () => {
        // 1ª página: 2 itens (limit 1 → +1 = 2) para gerar nextCursor
        const rows1 = [
            fakeRecord({ nf: nfNode({ chaveAcesso: 'a' }), emit: empNode('111', 'SP'), dest: null }),
            fakeRecord({ nf: nfNode({ chaveAcesso: 'b' }), emit: empNode('111', 'SP'), dest: null }),
        ];
        const { driver, runs } = makeFakeDriver(() => rows1);
        const p1 = await listInvoices(driver, {}, { limit: 1, orderBy: 'chaveAcesso', order: 'asc' });
        expect(p1.nextCursor).toBeTruthy();

        await listInvoices(driver, {}, { limit: 1, orderBy: 'chaveAcesso', order: 'asc', cursor: p1.nextCursor! });
        const segunda = runs[1]!;
        expect(segunda.params.cursorChave).toBe('a'); // último item da página 1
        expect(segunda.cypher).toContain('$cursorV');
    });
});

describe('countInvoices (unit)', () => {
    it('retorna o total e usa count(DISTINCT nf)', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ total: 42 })]);
        const total = await countInvoices(driver, { status: 'ativa' });
        expect(total).toBe(42);
        expect(runs[0]!.cypher).toContain('count(DISTINCT nf)');
        expect(runs[0]!.params.status).toBe('ativa');
    });

    it('total ausente → 0', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await countInvoices(driver)).toBe(0);
    });
});

describe('getInvoice (unit)', () => {
    it('monta detalhe com emitente/destinatário, cfops e filtra itens sem produto', async () => {
        const itens = [
            { item: fakeNode({ numeroItem: 1, quantidade: 2, valorTotal: 10 }), produto: fakeNode({ idUnico: 'p1', descricao: 'X' }), ncm: fakeNode({ codigo: '6109' }) },
            { item: null, produto: null, ncm: null }, // sem produto → filtrado
        ];
        // A query agora retorna `cfops` (lista); a NF pode ter vários CFOPs (A1).
        const cfops = [fakeNode({ codigo: '5102', descricao: 'Venda' }), fakeNode({ codigo: '5101' })];
        const rec = fakeRecord({ nf: nfNode(), emit: empNode('111', 'SP'), dest: empNode('222', 'MG'), itens, cfops });
        const { driver } = makeFakeDriver(() => [rec]);

        const nf = await getInvoice(driver, '351');
        expect(nf).not.toBeNull();
        expect(nf!.chaveAcesso).toBe('351');
        expect((nf!.emitente as { cnpj: string }).cnpj).toBe('111');
        const lista = nf!.itens as unknown[];
        expect(lista).toHaveLength(1);
        // cfop = primeiro (compat. contrato); cfops = todos (sem perder os demais)
        expect((nf!.cfop as { codigo: string }).codigo).toBe('5102');
        expect((nf!.cfops as unknown[]).length).toBe(2);
    });

    it('NF sem CFOP: cfop/cfops ausentes (cfops vazio)', async () => {
        const rec = fakeRecord({ nf: nfNode(), emit: empNode('111', 'SP'), dest: null, itens: [], cfops: [] });
        const { driver } = makeFakeDriver(() => [rec]);
        const nf = await getInvoice(driver, '351');
        expect('cfop' in nf!).toBe(false);
        expect('cfops' in nf!).toBe(false);
    });

    it('chave inexistente → null', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await getInvoice(driver, 'nope')).toBeNull();
    });
});

describe('listEventos (unit)', () => {
    // 1ª chamada = total; 2ª = página de eventos com a NF associada.
    const responder = (_c: string, _p: Record<string, unknown>, i: number) =>
        i === 0
            ? [fakeRecord({ total: 3 })]
            : [
                  fakeRecord({ tipo: 'consultada', timestamp: '2026-06-01T10:00:00Z', autor: 'u1', chaveAcesso: '351', numero: '7' }),
                  fakeRecord({ tipo: 'importada', timestamp: '2026-05-30T09:00:00Z', autor: null, chaveAcesso: '352', numero: '8' }),
              ];

    it('retorna total + eventos com a NF associada, ordenados por timestamp desc', async () => {
        const { driver, runs } = makeFakeDriver(responder);
        const page = await listEventos(driver, { limit: 20 });
        expect(page.total).toBe(3);
        expect(page.eventos).toHaveLength(2);
        expect(page.eventos[0]).toMatchObject({ tipo: 'consultada', chaveAcesso: '351', numero: '7' });
        expect(page.eventos[1]!.autor).toBeNull();
        expect(runs[1]!.cypher).toContain('ORDER BY ev.timestamp DESC');
    });

    it('filtra por tipo quando informado', async () => {
        const { driver, runs } = makeFakeDriver(responder);
        await listEventos(driver, { tipo: 'consultada' });
        expect(runs[1]!.cypher).toContain('WHERE ev.tipo = $tipo');
        expect(runs[1]!.params.tipo).toBe('consultada');
    });

    it('faz clamp do limit em [1,200] e offset >= 0', async () => {
        const { driver, runs } = makeFakeDriver(responder);
        await listEventos(driver, { limit: 9999, offset: -5 });
        expect((runs[1]!.params.limit as { toNumber: () => number }).toNumber()).toBe(200);
        expect((runs[1]!.params.offset as { toNumber: () => number }).toNumber()).toBe(0);
    });
});
