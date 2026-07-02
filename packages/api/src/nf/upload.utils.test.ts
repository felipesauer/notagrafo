import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { extrairXmls, LIMITES_ZIP_PADRAO, type LimitesZip } from './upload.utils.js';
import { ApiError } from '../errors.js';

/** Monta um Buffer ZIP com as entradas informadas (nome → conteúdo). */
function zipCom(entradas: Record<string, string>): Buffer {
    const zip = new AdmZip();
    for (const [nome, conteudo] of Object.entries(entradas)) {
        zip.addFile(nome, Buffer.from(conteudo, 'utf8'));
    }
    return zip.toBuffer();
}

describe('extrairXmls', () => {
    it('trata um upload single-XML como uma única entrada, sem aplicar limites de ZIP', () => {
        const xmls = extrairXmls(Buffer.from('<NFe/>', 'utf8'), 'nota.xml');
        expect(xmls).toEqual([{ nome: 'nota.xml', conteudo: '<NFe/>' }]);
    });

    it('extrai apenas os .xml de dentro de um ZIP, ignorando outros arquivos', () => {
        const buffer = zipCom({ 'a.xml': '<a/>', 'b.xml': '<b/>', 'leia-me.txt': 'ignorar' });
        const xmls = extrairXmls(buffer, 'lote.zip');
        expect(xmls.map((x) => x.nome).sort()).toEqual(['a.xml', 'b.xml']);
        expect(xmls.find((x) => x.nome === 'a.xml')?.conteudo).toBe('<a/>');
    });

    it('rejeita ZIP com mais entradas XML que o limite (400)', () => {
        const limites: LimitesZip = { ...LIMITES_ZIP_PADRAO, maxEntradas: 2 };
        const buffer = zipCom({ 'a.xml': '<a/>', 'b.xml': '<b/>', 'c.xml': '<c/>' });
        try {
            extrairXmls(buffer, 'lote.zip', limites);
            expect.unreachable('deveria ter lançado');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).statusCode).toBe(400);
            expect((err as ApiError).message).toMatch(/XMLs demais|3 arquivos/);
        }
    });

    it('rejeita quando o total descomprimido excede o limite de bytes (400)', () => {
        const limites: LimitesZip = { ...LIMITES_ZIP_PADRAO, maxBytesDescomprimidos: 10, maxRazaoCompressao: Infinity };
        const buffer = zipCom({ 'grande.xml': 'x'.repeat(64) });
        try {
            extrairXmls(buffer, 'lote.zip', limites);
            expect.unreachable('deveria ter lançado');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).statusCode).toBe(400);
            expect((err as ApiError).message).toMatch(/descomprimido/);
        }
    });

    it('rejeita entrada com razão de compressão suspeita — assinatura de zip bomb (400)', () => {
        // Conteúdo altamente repetitivo comprime muito → razão descomprimido/comprimido alta.
        const limites: LimitesZip = { ...LIMITES_ZIP_PADRAO, maxRazaoCompressao: 5, maxBytesDescomprimidos: Infinity };
        const buffer = zipCom({ 'bomba.xml': 'A'.repeat(100_000) });
        try {
            extrairXmls(buffer, 'lote.zip', limites);
            expect.unreachable('deveria ter lançado');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).statusCode).toBe(400);
            expect((err as ApiError).message).toMatch(/compress|bomb/i);
        }
    });

    it('aceita um ZIP válido dentro de todos os limites', () => {
        const buffer = zipCom({ 'nota1.xml': '<NFe>1</NFe>', 'nota2.xml': '<NFe>2</NFe>' });
        const xmls = extrairXmls(buffer, 'lote.zip');
        expect(xmls).toHaveLength(2);
        expect(xmls.map((x) => x.conteudo).sort()).toEqual(['<NFe>1</NFe>', '<NFe>2</NFe>']);
    });
});
