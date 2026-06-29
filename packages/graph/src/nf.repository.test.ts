import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { parseNFe, type RawDataNode } from '@notagrafo/core';
import { makeFakeDriver } from './__test-helpers__/fake-driver.js';
import { mergeInvoice, type InvoiceToPersist } from './nf.repository.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core', 'src', '__fixtures__');

function payloadFrom(arquivo: string): InvoiceToPersist {
    const conteudo = readFileSync(join(FIXTURES, arquivo), 'utf8');
    const parsed = parseNFe(conteudo, new Date('2026-06-26T12:00:00Z'));
    const raw: RawDataNode = {
        xmlGzip: gzipSync(Buffer.from(conteudo)),
        jsonCompleto: JSON.stringify(parsed),
        checksum: createHash('sha256').update(conteudo).digest('hex'),
        tamanhoBytes: Buffer.byteLength(conteudo),
        versaoSchema: '4.00',
    };
    return { ...parsed, raw };
}

function payload(): InvoiceToPersist {
    return payloadFrom('nfe-valida-v4.00.xml');
}

describe('mergeInvoice (unit, driver fake)', () => {
    it('grava emitente, NF, raw, relações, itens e evento numa transação', async () => {
        const fake = makeFakeDriver(() => []);
        const { driver, runs } = fake;
        const dados = payload();
        await mergeInvoice(driver, dados);

        const cyphers = runs.map((r) => r.cypher).join('\n---\n');
        // sequência essencial do padrão MERGE (01 schema dados §4)
        expect(cyphers).toContain('MERGE (emit:Empresa {cnpj: $cnpj})');
        expect(cyphers).toContain('MERGE (nf:NotaFiscal {chaveAcesso: $chave})');
        expect(cyphers).toContain('MERGE (nf)-[:TEM_RAW]->(raw:RawData)');
        expect(cyphers).toContain('MERGE (emit)-[:EMITIU]->(nf)');
        expect(cyphers).toContain("CREATE (ev:Evento {tipo: 'importada'");
        // pelo menos um item gravado (CONTÉM)
        expect(cyphers).toContain('MERGE (nf)-[c:CONTÉM {numeroItem: $numeroItem}]->(prod)');
        // datas serializadas como ISO string (não Date) no SET da NF
        const setNF = runs.find((r) => r.cypher.includes('MERGE (nf:NotaFiscal'))!;
        expect((setNF.params.dados as { dataEmissao: unknown }).dataEmissao).toEqual(expect.any(String));
        // a sessão foi fechada
        expect(fake.sessionsClosed).toBe(1);
    });

    it('grava destinatário e a relação DESTINADA_A quando presente', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const dados = payload();
        expect(dados.destinatario).toBeTruthy(); // a fixture tem destinatário
        await mergeInvoice(driver, dados);
        const cyphers = runs.map((r) => r.cypher).join('\n');
        expect(cyphers).toContain('MERGE (dest:Empresa {cnpj: $cnpj})');
        expect(cyphers).toContain('MERGE (nf)-[:DESTINADA_A]->(dest)');
    });

    it('sem destinatário não emite as queries de destinatário', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const dados = payload();
        delete (dados as { destinatario?: unknown }).destinatario;
        await mergeInvoice(driver, dados);
        const cyphers = runs.map((r) => r.cypher).join('\n');
        expect(cyphers).not.toContain('DESTINADA_A');
    });

    it('enriquece NCM e CFOP com o catálogo (SET incondicional)', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await mergeInvoice(driver, payload());
        const itemRun = runs.find((r) => r.cypher.includes('MERGE (ncm:NCM'))!;
        // SET incondicional (aplica catálogo até em nó pré-existente)
        expect(itemRun.cypher).toContain('MERGE (ncm:NCM {codigo: $codigoNcm}) SET ncm += $dadosNcm');
        expect(itemRun.cypher).toContain('MERGE (cfop:CFOP {codigo: $codigoCfop}) SET cfop += $dadosCfop');
        // NCM 61091000 → capítulo 61 (vestuário de malha); CFOP 5102 → saída interna
        expect(itemRun.params.dadosNcm).toMatchObject({ codigo: '61091000', capitulo: '61', descricao: expect.stringContaining('Vestuário') });
        expect(itemRun.params.dadosCfop).toMatchObject({ codigo: '5102', tipo: 'saida', natureza: 'interna', descricao: expect.any(String) });
    });

    it('achata os totais da NF como propriedades total_* no nó', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await mergeInvoice(driver, payloadFrom('nfe-tributada-v4.00.xml'));
        const setNF = runs.find((r) => r.cypher.includes('MERGE (nf:NotaFiscal'))!;
        const dados = setNF.params.dados as Record<string, unknown>;
        expect(dados.total_vNF).toBe(1373.5);
        expect(dados.total_vICMS).toBe(180);
        expect(dados.total_vICMSST ?? dados.total_vST).toBeDefined();
    });

    it('grava aresta DEVOLVE (idempotente) para a NF referenciada numa devolução', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await mergeInvoice(driver, payloadFrom('nfe-devolucao-ref-v4.00.xml'));
        const devolve = runs.find((r) => r.cypher.includes('DEVOLVE'));
        expect(devolve).toBeTruthy();
        expect(devolve!.cypher).toContain('MERGE (orig:NotaFiscal {chaveAcesso: $chaveRef})');
        expect(devolve!.cypher).toContain('MERGE (nf)-[d:DEVOLVE]->(orig)');
        expect(devolve!.params.chaveRef).toBe('35200114200166000187550010000000071234567890');
    });

    it('não grava DEVOLVE quando a NF não é devolução', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await mergeInvoice(driver, payload()); // finNFe=1 (normal)
        expect(runs.some((r) => r.cypher.includes('DEVOLVE'))).toBe(false);
    });
});
