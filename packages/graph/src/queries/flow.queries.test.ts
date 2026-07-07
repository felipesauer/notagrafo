import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { getFluxoEmpresas, getRedeGlobal } from './flow.queries.js';

describe('getFluxoEmpresas (unit)', () => {
    it('mapeia os pares emitente→destinatário com nome e valores', async () => {
        const recs = [
            fakeRecord({ de: '111', para: '222', deNome: 'Alpha', paraNome: 'Beta', totalNFs: 5, valorTotal: 9000 }),
            fakeRecord({ de: '111', para: '333', deNome: 'Alpha', paraNome: 'Gama', totalNFs: 2, valorTotal: 1500 }),
        ];
        const { driver, runs } = makeFakeDriver(() => recs);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.arestas).toEqual([
            { de: '111', para: '222', deNome: 'Alpha', paraNome: 'Beta', totalNFs: 5, valorTotal: 9000 },
            { de: '111', para: '333', deNome: 'Alpha', paraNome: 'Gama', totalNFs: 2, valorTotal: 1500 },
        ]);
        // ignora laços e ordena por valor desc
        expect(runs[0]!.cypher).toContain('a.cnpj <> b.cnpj');
        expect(runs[0]!.cypher).toContain('ORDER BY valorTotal DESC');
    });

    it('aplica o limite padrão (30) e o repassa como parâmetro', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.limite).toBe(30);
        // neo4j.int(30) tem toNumber() === 30
        expect((runs[0]!.params.limite as { toNumber: () => number }).toNumber()).toBe(30);
    });

    it('faz clamp do limite em [1,100]', async () => {
        const { driver: d1 } = makeFakeDriver(() => []);
        expect((await getFluxoEmpresas(d1, { limite: 999 })).limite).toBe(100);
        const { driver: d2 } = makeFakeDriver(() => []);
        expect((await getFluxoEmpresas(d2, { limite: 0 })).limite).toBe(1);
    });

    it('nome nulo vira string vazia', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ de: '111', para: '222', deNome: null, paraNome: null, totalNFs: 1, valorTotal: 10 }),
        ]);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.arestas[0]!.deNome).toBe('');
        expect(fluxo.arestas[0]!.paraNome).toBe('');
    });
});

describe('getRedeGlobal (unit)', () => {
    // 1ª chamada = arestas; 2ª chamada = nós das empresas que aparecem nas arestas.
    const responder = (_c: string, _p: Record<string, unknown>, i: number) =>
        i === 0
            ? [
                  fakeRecord({ de: '111', para: '222', totalNFs: 5, valorTotal: 9000 }),
                  fakeRecord({ de: '222', para: '333', totalNFs: 2, valorTotal: 1500 }),
              ]
            : [
                  fakeRecord({ cnpj: '111', razaoSocial: 'Alpha', uf: 'SP', totalNFs: 10 }),
                  fakeRecord({ cnpj: '222', razaoSocial: 'Beta', uf: 'MG', totalNFs: 7 }),
                  fakeRecord({ cnpj: '333', razaoSocial: 'Gama', uf: 'RS', totalNFs: 2 }),
              ];

    it('retorna arestas (top por valor, sem laços) e os nós participantes', async () => {
        const { driver, runs } = makeFakeDriver(responder);
        const rede = await getRedeGlobal(driver, { limite: 50 });
        expect(rede.arestas).toHaveLength(2);
        expect(rede.nos).toHaveLength(3);
        expect(rede.nos[0]).toMatchObject({ cnpj: '111', razaoSocial: 'Alpha', uf: 'SP', totalNFs: 10 });
        expect(runs[0]!.cypher).toContain('a.cnpj <> b.cnpj');
        // a query de nós recebe os cnpjs deduplicados das arestas
        expect(runs[1]!.params.cnpjs).toEqual(['111', '222', '333']);
        // a soma emitidas+recebidas agrega em WITHs separados (Cypher não permite
        // misturar uma variável já agregada com uma nova agregação no RETURN).
        expect(runs[1]!.cypher).toContain('count(nfR) AS recebidas');
        expect(runs[1]!.cypher).toContain('(emitidas + recebidas)');
    });

    it('sem arestas → não consulta nós e devolve listas vazias', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const rede = await getRedeGlobal(driver);
        expect(rede.arestas).toEqual([]);
        expect(rede.nos).toEqual([]);
        expect(runs).toHaveLength(1); // só a query de arestas rodou
    });

    it('faz clamp do limite em [1,500]', async () => {
        const { driver: d1 } = makeFakeDriver(() => []);
        expect((await getRedeGlobal(d1, { limite: 9999 })).limite).toBe(500);
        const { driver: d2 } = makeFakeDriver(() => []);
        expect((await getRedeGlobal(d2, { limite: 0 })).limite).toBe(1);
    });

    it('aplica recorte temporal na query de arestas (EPIC-28)', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await getRedeGlobal(driver, { dataInicio: '2026-06-01', dataFim: '2026-06-30' });
        // a cláusula de data entra no WHERE das arestas com os params
        expect(runs[0]!.cypher).toContain('nf.dataEmissao >= $dataInicio');
        expect(runs[0]!.cypher).toContain('nf.dataEmissao <= $dataFim');
        expect(runs[0]!.params.dataInicio).toBe('2026-06-01');
        expect(String(runs[0]!.params.dataFim).startsWith('2026-06-30')).toBe(true);
    });

    it('sem datas não injeta cláusula temporal', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await getRedeGlobal(driver, { limite: 10 });
        expect(runs[0]!.cypher).not.toContain('dataEmissao');
    });

    it('o tamanho do nó respeita status e recorte temporal (não conta atividade de fora)', async () => {
        // responder com 1 aresta para forçar a 2ª query (nós)
        const responder = (_c: string, _p: Record<string, unknown>, i: number) =>
            i === 0 ? [fakeRecord({ de: '111', para: '222', totalNFs: 1, valorTotal: 10 })] : [];
        const { driver, runs } = makeFakeDriver(responder);
        await getRedeGlobal(driver, { dataInicio: '2026-06-01', dataFim: '2026-06-30' });
        // a query de nós (runs[1]) filtra por status e pela janela nas duas direções
        expect(runs[1]!.cypher).toContain('nfE.status IS NOT NULL');
        expect(runs[1]!.cypher).toContain('nfE.dataEmissao >= $dataInicio');
        expect(runs[1]!.cypher).toContain('nfR.dataEmissao <= $dataFim');
        expect(runs[1]!.params.dataInicio).toBe('2026-06-01');
    });
});
