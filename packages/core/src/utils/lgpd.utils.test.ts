import { describe, it, expect } from 'vitest';
import { isCpf, maskCpf, maskCpfIf } from './lgpd.utils.js';

describe('isCpf', () => {
    it('reconhece 11 dígitos (com ou sem pontuação) como CPF', () => {
        expect(isCpf('12345689100')).toBe(true);
        expect(isCpf('123.456.891-00')).toBe(true);
    });
    it('não considera CNPJ (14 dígitos) nem strings vazias como CPF', () => {
        expect(isCpf('12345678000199')).toBe(false);
        expect(isCpf('')).toBe(false);
        expect(isCpf('abc')).toBe(false);
    });
});

describe('maskCpf', () => {
    it('mascara CPF preservando os 2 dígitos verificadores', () => {
        expect(maskCpf('12345689100')).toBe('***.***.***-00');
        expect(maskCpf('123.456.891-77')).toBe('***.***.***-77');
    });
    it('deixa CNPJ (14 dígitos) intacto', () => {
        expect(maskCpf('12345678000199')).toBe('12345678000199');
    });
    it('deixa valor não-documento intacto', () => {
        expect(maskCpf('')).toBe('');
        expect(maskCpf('n/a')).toBe('n/a');
    });
});

describe('maskCpfIf', () => {
    it('mascara CPF só quando ativo', () => {
        expect(maskCpfIf(true, '12345689100')).toBe('***.***.***-00');
        expect(maskCpfIf(false, '12345689100')).toBe('12345689100');
    });
    it('nunca altera CNPJ, independente da flag', () => {
        expect(maskCpfIf(true, '12345678000199')).toBe('12345678000199');
    });
});
