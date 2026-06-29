import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNFe, NFeParseError } from './nfe.parser.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');
const fixture = (name: string): string => readFileSync(join(FIXTURES, name), 'utf8');
const IMPORTADO_EM = new Date('2026-06-26T12:00:00Z');

describe('parseNFe', () => {
    it('extrai uma NFe completa para os tipos do core', () => {
        const nf = parseNFe(fixture('nfe-valida-v4.00.xml'), IMPORTADO_EM);

        expect(nf.nota.chaveAcesso).toBe('35200114200166000187550010000000071234567890');
        expect(nf.nota.numero).toBe('7');
        expect(nf.nota.serie).toBe('1');
        expect(nf.nota.tipoNF).toBe('saida');
        expect(nf.nota.finalidade).toBe('normal');
        expect(nf.nota.valorTotal).toBe(10);
        expect(nf.nota.importadaEm).toBe(IMPORTADO_EM);

        expect(nf.emitente.cnpj).toBe('14200166000187');
        expect(nf.emitente.regimeTributario).toBe('normal'); // CRT=3
        expect(nf.destinatario?.cnpj).toBe('99999999000191');

        expect(nf.itens).toHaveLength(1);
        const item = nf.itens[0]!;
        expect(item.produto.codigo).toBe('PROD001');
        // EAN 'SEM GTIN' → idUnico cai no fallback codigo::cnpj
        expect(item.produto.idUnico).toBe('PROD001::14200166000187');
        expect(item.ncm.codigo).toBe('61091000');
        expect(item.cfop.codigo).toBe('5102');
        expect(item.contem.numeroItem).toBe(1);
        expect(item.contem.valorTotal).toBe(10);
    });

    it('não gera chaves null/undefined para opcionais ausentes (regra 6)', () => {
        const nf = parseNFe(fixture('nfe-valida-v4.00.xml'), IMPORTADO_EM);

        // a fixture não tem infAdic nem xFant — as chaves não devem existir
        expect('infCpl' in nf.nota).toBe(false);
        expect('infAdFisco' in nf.nota).toBe(false);
        expect('nomeFantasia' in nf.emitente).toBe(false);
        expect('im' in nf.emitente).toBe(false);

        // EAN 'SEM GTIN' é sentinela → não vira propriedade ean
        expect('ean' in nf.itens[0]!.produto).toBe(false);

        // nenhum valor das propriedades presentes é null/undefined
        for (const v of Object.values(nf.nota)) {
            expect(v).not.toBeNull();
            expect(v).not.toBeUndefined();
        }
    });

    it('mapeia finNFe=4 para finalidade "devolucao"', () => {
        const nf = parseNFe(fixture('nfe-devolucao-v4.00.xml'), IMPORTADO_EM);
        expect(nf.nota.finalidade).toBe('devolucao');
    });

    it('importa toda NF com status "ativa" — cancelamento é evento posterior (regra 5)', () => {
        // O parser nunca produz status 'cancelada': isso é estado do grafo
        // aplicado por um evento de cancelamento, não pela importação do XML.
        const nf = parseNFe(fixture('nfe-valida-v4.00.xml'), IMPORTADO_EM);
        expect(nf.nota.status).toBe('ativa');
        const dev = parseNFe(fixture('nfe-devolucao-v4.00.xml'), IMPORTADO_EM);
        expect(dev.nota.status).toBe('ativa');
    });

    it('lança NFeParseError quando não há infNFe', () => {
        expect(() => parseNFe('<NFe></NFe>', IMPORTADO_EM)).toThrow(NFeParseError);
    });

    // Variações do XML base para cobrir os mapeamentos de finalidade/regime/chave.
    const base = () => fixture('nfe-valida-v4.00.xml');

    it.each([
        ['2', 'complementar'],
        ['3', 'ajuste'],
        ['1', 'normal'],
    ])('mapeia finNFe=%s para finalidade "%s"', (finNFe, esperado) => {
        const xml = base().replace(/<finNFe>\d<\/finNFe>/, `<finNFe>${finNFe}</finNFe>`);
        expect(parseNFe(xml, IMPORTADO_EM).nota.finalidade).toBe(esperado);
    });

    it.each([
        ['1', 'simples'],
        ['2', 'simplesExcesso'],
    ])('mapeia CRT=%s para regime "%s"', (crt, esperado) => {
        const xml = base().replace(/<CRT>\d<\/CRT>/, `<CRT>${crt}</CRT>`);
        expect(parseNFe(xml, IMPORTADO_EM).emitente.regimeTributario).toBe(esperado);
    });

    it('CRT desconhecido → regimeTributario ausente', () => {
        const xml = base().replace(/<CRT>\d<\/CRT>/, '<CRT>9</CRT>');
        const nf = parseNFe(xml, IMPORTADO_EM);
        expect('regimeTributario' in nf.emitente).toBe(false);
    });

    it('lança NFeParseError quando o Id (chave de acesso) está ausente', () => {
        const xml = base().replace(/Id="NFe\d+"/, 'versao="4.00"');
        expect(() => parseNFe(xml, IMPORTADO_EM)).toThrow(NFeParseError);
    });
});
