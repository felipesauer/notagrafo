import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord, fakeNode } from '../__test-helpers__/fake-driver.js';
import { listNotasFiscais, countNotasFiscais, filtrosAtivos, getNotaFiscal } from './nf.queries.js';

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

describe('filtrosAtivos (unit)', () => {
    it('lista apenas chaves preenchidas, ignorando undefined e vazio', () => {
        expect(filtrosAtivos({ status: 'ativa', numero: '', ufEmitente: 'SP' })).toEqual(['status', 'ufEmitente']);
        expect(filtrosAtivos({})).toEqual([]);
    });
});

describe('listNotasFiscais (unit, driver fake)', () => {
    it('mapeia nó/emitente/destinatário e respeita limit (hasMore via N+1)', async () => {
        // pede limit 2 → query usa limit+1=3; devolvemos 3 → hasMore true, 2 itens
        const rows = [
            [nfNode({ chaveAcesso: 'a' }), empNode('111', 'SP'), empNode('222', 'MG')],
            [nfNode({ chaveAcesso: 'b' }), empNode('111', 'SP'), null],
            [nfNode({ chaveAcesso: 'c' }), empNode('111', 'SP'), null],
        ].map(([nf, emit, dest]) => fakeRecord({ nf, emit, dest }));
        const { driver, runs } = makeFakeDriver(() => rows);

        const page = await listNotasFiscais(driver, {}, { limit: 2, orderBy: 'chaveAcesso', order: 'asc' });
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
        const page = await listNotasFiscais(driver, {}, { limit: 20, orderBy: 'campo_invalido' });
        expect(page.hasMore).toBe(false);
        expect(page.nextCursor).toBeNull();
        expect(runs[0]!.cypher).toContain('ORDER BY nf.dataEmissao');
    });

    it('aplica todos os filtros nos params da query (where + matches)', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await listNotasFiscais(driver, {
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

    it('cursor é round-trip: a 2ª página injeta cursorV/cursorChave nos params', async () => {
        // 1ª página: 2 itens (limit 1 → +1 = 2) para gerar nextCursor
        const rows1 = [
            fakeRecord({ nf: nfNode({ chaveAcesso: 'a' }), emit: empNode('111', 'SP'), dest: null }),
            fakeRecord({ nf: nfNode({ chaveAcesso: 'b' }), emit: empNode('111', 'SP'), dest: null }),
        ];
        const { driver, runs } = makeFakeDriver(() => rows1);
        const p1 = await listNotasFiscais(driver, {}, { limit: 1, orderBy: 'chaveAcesso', order: 'asc' });
        expect(p1.nextCursor).toBeTruthy();

        await listNotasFiscais(driver, {}, { limit: 1, orderBy: 'chaveAcesso', order: 'asc', cursor: p1.nextCursor! });
        const segunda = runs[1]!;
        expect(segunda.params.cursorChave).toBe('a'); // último item da página 1
        expect(segunda.cypher).toContain('$cursorV');
    });
});

describe('countNotasFiscais (unit)', () => {
    it('retorna o total e usa count(DISTINCT nf)', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ total: 42 })]);
        const total = await countNotasFiscais(driver, { status: 'ativa' });
        expect(total).toBe(42);
        expect(runs[0]!.cypher).toContain('count(DISTINCT nf)');
        expect(runs[0]!.params.status).toBe('ativa');
    });

    it('total ausente → 0', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await countNotasFiscais(driver)).toBe(0);
    });
});

describe('getNotaFiscal (unit)', () => {
    it('monta detalhe com emitente/destinatário e filtra itens sem produto', async () => {
        const itens = [
            { item: fakeNode({ numeroItem: 1, quantidade: 2, valorTotal: 10 }), produto: fakeNode({ idUnico: 'p1', descricao: 'X' }), ncm: fakeNode({ codigo: '6109' }) },
            { item: null, produto: null, ncm: null }, // sem produto → filtrado
        ];
        const rec = fakeRecord({ nf: nfNode(), emit: empNode('111', 'SP'), dest: empNode('222', 'MG'), itens });
        const { driver } = makeFakeDriver(() => [rec]);

        const nf = await getNotaFiscal(driver, '351');
        expect(nf).not.toBeNull();
        expect(nf!.chaveAcesso).toBe('351');
        expect((nf!.emitente as { cnpj: string }).cnpj).toBe('111');
        const lista = nf!.itens as unknown[];
        expect(lista).toHaveLength(1);
    });

    it('chave inexistente → null', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await getNotaFiscal(driver, 'nope')).toBeNull();
    });
});
