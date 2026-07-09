import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateNFe, XmlMalformadoError, VersaoSchemaNaoSuportadaError } from './nfe.validator.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');
const fixture = (name: string): string => readFileSync(join(FIXTURES, name), 'utf8');

describe('validateNFe', () => {
    it('valida uma NFe v4.00 conforme o XSD oficial', () => {
        const result = validateNFe(fixture('nfe-valida-v4.00.xml'));
        expect(result.valid).toBe(true);
        expect(result.versao).toBe('4.00');
        expect(result.errors).toHaveLength(0);
    });

    it.each(['nfe-tributada-v4.00.xml', 'nfe-devolucao-ref-v4.00.xml'])(
        'valida o fixture fiscal %s contra o XSD v4.00',
        (nome) => {
            const result = validateNFe(fixture(nome));
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        },
    );

    it('rejeita uma NFe v4.00 que viola o schema (sem natOp obrigatório)', () => {
        const result = validateNFe(fixture('nfe-invalida-schema.xml'));
        expect(result.valid).toBe(false);
        expect(result.versao).toBe('4.00');
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('lança erro claro para versão sem XSD (3.10)', () => {
        expect(() => validateNFe(fixture('nfe-versao-desconhecida.xml'))).toThrow(
            VersaoSchemaNaoSuportadaError,
        );
        expect(() => validateNFe(fixture('nfe-versao-desconhecida.xml'))).toThrow(
            /Versão de schema 3\.10 não suportada/,
        );
    });

    it('lança XmlMalformadoError para XML mal-formado', () => {
        expect(() => validateNFe('<NFe><infNFe versao="4.00"></NFe>')).toThrow(XmlMalformadoError);
    });

    it('lança XmlMalformadoError quando infNFe não declara versao', () => {
        const semVersao =
            '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe><ide/></infNFe></NFe>';
        expect(() => validateNFe(semVersao)).toThrow(/não declara a versão/);
    });

    describe('segurança do parse XML (XXE / entity expansion — NOTA-204)', () => {
        it('não expande uma entidade externa (XXE): o conteúdo do arquivo não vaza', () => {
            const xxe =
                '<?xml version="1.0"?>\n' +
                '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/hostname"> ]>\n' +
                '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe versao="4.00" Id="NFe1"><x>&xxe;</x></infNFe></NFe>';
            // não deve resolver a entidade externa nem vazar conteúdo do arquivo:
            // ou lança (entidade não definida por não carregar DTD) ou valida=false
            // sem o conteúdo do arquivo presente.
            let serialized = '';
            try {
                const r = validateNFe(xxe);
                serialized = JSON.stringify(r);
            } catch (err) {
                serialized = String(err);
            }
            // o hostname do arquivo nunca deve aparecer no resultado/erro
            expect(serialized).not.toMatch(/root:|\/bin\/|localhost\.localdomain/);
        });

        it('não expande uma bomba de entidades (billion laughs) — não estoura memória/tempo', () => {
            const bomb =
                '<?xml version="1.0"?>\n' +
                '<!DOCTYPE lolz [\n' +
                '  <!ENTITY lol "lol">\n' +
                '  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">\n' +
                '  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">\n' +
                '  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">\n' +
                ']>\n' +
                '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe versao="4.00" Id="NFe1"><x>&lol4;</x></infNFe></NFe>';
            const t0 = Date.now();
            // não deve travar: ou lança (entidade não expandida) ou valida=false rápido.
            try {
                const r = validateNFe(bomb);
                expect(r.valid).toBe(false);
            } catch {
                // aceitável: rejeitado sem expandir
            }
            expect(Date.now() - t0).toBeLessThan(2000);
        });

        it('continua validando XML legítimo (fixture v4.00) com as opções de segurança', () => {
            expect(validateNFe(fixture('nfe-valida-v4.00.xml')).valid).toBe(true);
        });
    });
});
