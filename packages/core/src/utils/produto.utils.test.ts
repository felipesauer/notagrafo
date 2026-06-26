import { describe, it, expect } from 'vitest';
import { resolveIdUnico } from './produto.utils.js';

describe('resolveIdUnico', () => {
    const base = { codigo: 'PROD001', cnpjEmitente: '12345678000199' };

    it('usa o EAN quando presente e válido', () => {
        expect(resolveIdUnico({ ...base, ean: '7891234567890' })).toBe('7891234567890');
    });

    it('faz fallback para codigo::cnpj quando o EAN é "SEM GTIN"', () => {
        expect(resolveIdUnico({ ...base, ean: 'SEM GTIN' })).toBe('PROD001::12345678000199');
    });

    it('trata "SEM GTIN" de forma case-insensitive e com espaços', () => {
        expect(resolveIdUnico({ ...base, ean: '  sem gtin  ' })).toBe('PROD001::12345678000199');
    });

    it('faz fallback para codigo::cnpj quando o EAN está ausente', () => {
        expect(resolveIdUnico(base)).toBe('PROD001::12345678000199');
    });

    it('faz fallback quando o EAN é string vazia', () => {
        expect(resolveIdUnico({ ...base, ean: '' })).toBe('PROD001::12345678000199');
    });
});
