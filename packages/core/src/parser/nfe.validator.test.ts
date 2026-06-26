import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarNFe, XmlMalformadoError, VersaoSchemaNaoSuportadaError } from './nfe.validator.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');
const fixture = (name: string): string => readFileSync(join(FIXTURES, name), 'utf8');

describe('validarNFe', () => {
    it('valida uma NFe v4.00 conforme o XSD oficial', () => {
        const result = validarNFe(fixture('nfe-valida-v4.00.xml'));
        expect(result.valid).toBe(true);
        expect(result.versao).toBe('4.00');
        expect(result.errors).toHaveLength(0);
    });

    it('rejeita uma NFe v4.00 que viola o schema (sem natOp obrigatório)', () => {
        const result = validarNFe(fixture('nfe-invalida-schema.xml'));
        expect(result.valid).toBe(false);
        expect(result.versao).toBe('4.00');
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('lança erro claro para versão sem XSD (3.10)', () => {
        expect(() => validarNFe(fixture('nfe-versao-desconhecida.xml'))).toThrow(
            VersaoSchemaNaoSuportadaError,
        );
        expect(() => validarNFe(fixture('nfe-versao-desconhecida.xml'))).toThrow(
            /Versão de schema 3\.10 não suportada/,
        );
    });

    it('lança XmlMalformadoError para XML mal-formado', () => {
        expect(() => validarNFe('<NFe><infNFe versao="4.00"></NFe>')).toThrow(XmlMalformadoError);
    });

    it('lança XmlMalformadoError quando infNFe não declara versao', () => {
        const semVersao =
            '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe><ide/></infNFe></NFe>';
        expect(() => validarNFe(semVersao)).toThrow(/não declara a versão/);
    });
});
