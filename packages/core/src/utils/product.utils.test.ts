import { describe, it, expect } from 'vitest';
import { resolveUniqueId } from './product.utils.js';

describe('resolveUniqueId', () => {
    const base = { codigo: 'PROD001', cnpjEmitente: '12345678000199' };

    it('usa o EAN quando presente e válido', () => {
        expect(resolveUniqueId({ ...base, ean: '7891234567890' })).toBe('7891234567890');
    });

    it('faz fallback para codigo::cnpj quando o EAN é "SEM GTIN"', () => {
        expect(resolveUniqueId({ ...base, ean: 'SEM GTIN' })).toBe('PROD001::12345678000199');
    });

    it('trata "SEM GTIN" de forma case-insensitive e com espaços', () => {
        expect(resolveUniqueId({ ...base, ean: '  sem gtin  ' })).toBe('PROD001::12345678000199');
    });

    it('faz fallback para codigo::cnpj quando o EAN está ausente', () => {
        expect(resolveUniqueId(base)).toBe('PROD001::12345678000199');
    });

    it('faz fallback quando o EAN é string vazia', () => {
        expect(resolveUniqueId({ ...base, ean: '' })).toBe('PROD001::12345678000199');
    });
});
