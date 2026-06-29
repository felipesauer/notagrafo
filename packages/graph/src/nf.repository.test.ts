import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { parseNFe, type RawDataNode } from '@notagrafo/core';
import { makeFakeDriver } from './__test-helpers__/fake-driver.js';
import { mergeNotaFiscal, type NotaFiscalParaGravar } from './nf.repository.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core', 'src', '__fixtures__');
const xml = readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');

function payload(): NotaFiscalParaGravar {
    const parsed = parseNFe(xml, new Date('2026-06-26T12:00:00Z'));
    const raw: RawDataNode = {
        xmlGzip: gzipSync(Buffer.from(xml)),
        jsonCompleto: JSON.stringify(parsed),
        checksum: createHash('sha256').update(xml).digest('hex'),
        tamanhoBytes: Buffer.byteLength(xml),
        versaoSchema: '4.00',
    };
    return { ...parsed, raw };
}

describe('mergeNotaFiscal (unit, driver fake)', () => {
    it('grava emitente, NF, raw, relações, itens e evento numa transação', async () => {
        const fake = makeFakeDriver(() => []);
        const { driver, runs } = fake;
        const dados = payload();
        await mergeNotaFiscal(driver, dados);

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
        await mergeNotaFiscal(driver, dados);
        const cyphers = runs.map((r) => r.cypher).join('\n');
        expect(cyphers).toContain('MERGE (dest:Empresa {cnpj: $cnpj})');
        expect(cyphers).toContain('MERGE (nf)-[:DESTINADA_A]->(dest)');
    });

    it('sem destinatário não emite as queries de destinatário', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const dados = payload();
        delete (dados as { destinatario?: unknown }).destinatario;
        await mergeNotaFiscal(driver, dados);
        const cyphers = runs.map((r) => r.cypher).join('\n');
        expect(cyphers).not.toContain('DESTINADA_A');
    });
});
