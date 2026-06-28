import { describe, it, expect } from 'vitest';
import { stringifySearch, parseSearch } from './router.js';

describe('serializadores de search do router (NOTA-48)', () => {
    it('string simples vai SEM aspas na URL e volta como string', () => {
        const qs = stringifySearch({ cnpj: '14200166000187' });
        expect(qs).toBe('?cnpj=14200166000187'); // sem %22
        expect(parseSearch(qs).cnpj).toBe('14200166000187');
    });

    it('CNPJ numérico longo NÃO vira number (regressão do bug do grafo)', () => {
        const parsed = parseSearch(stringifySearch({ cnpj: '14200166000187' }));
        expect(typeof parsed.cnpj).toBe('string');
        expect(parsed.cnpj).toBe('14200166000187');
    });

    it('caminho com / (redirect do login) faz round-trip', () => {
        const qs = stringifySearch({ redirect: '/nf' });
        expect(parseSearch(qs).redirect).toBe('/nf');
    });

    it('objeto/array usa JSON e faz round-trip', () => {
        const qs = stringifySearch({ filtro: { uf: 'SP' } });
        expect(parseSearch(qs).filtro).toEqual({ uf: 'SP' });
    });

    it('valores undefined são omitidos da URL', () => {
        expect(stringifySearch({ cnpj: undefined })).toBe('');
    });
});
