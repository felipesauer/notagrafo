import { describe, it, expect } from 'vitest';
import { lookupCfop } from './cfop.catalog.js';

describe('lookupCfop', () => {
    it('resolve descrição, tipo e natureza de um CFOP conhecido (5102 — saída interna)', () => {
        expect(lookupCfop('5102')).toEqual({
            tipo: 'saida',
            natureza: 'interna',
            descricao: 'Venda de mercadoria adquirida ou recebida de terceiros',
        });
    });

    it('resolve os CFOPs comuns citados no critério (5101, 5403, 6102, 1102, 2102)', () => {
        expect(lookupCfop('5101').descricao).toBe('Venda de produção do estabelecimento');
        expect(lookupCfop('5403').natureza).toBe('interna');
        expect(lookupCfop('6102')).toMatchObject({ tipo: 'saida', natureza: 'interestadual' });
        expect(lookupCfop('1102')).toMatchObject({ tipo: 'entrada', natureza: 'interna' });
        expect(lookupCfop('2102')).toMatchObject({ tipo: 'entrada', natureza: 'interestadual' });
    });

    it('infere tipo e natureza pelo 1º dígito para CFOP fora da tabela de descrições', () => {
        // 5999 não está em DESCRICOES, mas o 5 indica saída interna
        expect(lookupCfop('5999')).toEqual({ tipo: 'saida', natureza: 'interna' });
        // 3xxx = entrada do exterior; 7xxx = saída para o exterior
        expect(lookupCfop('3949')).toEqual({ tipo: 'entrada', natureza: 'exterior' });
        expect(lookupCfop('7949')).toEqual({ tipo: 'saida', natureza: 'exterior' });
    });

    it('cobre todos os 1ºs dígitos válidos (1,2,3,5,6,7)', () => {
        expect(lookupCfop('1000')).toMatchObject({ tipo: 'entrada', natureza: 'interna' });
        expect(lookupCfop('2000')).toMatchObject({ tipo: 'entrada', natureza: 'interestadual' });
        expect(lookupCfop('3000')).toMatchObject({ tipo: 'entrada', natureza: 'exterior' });
        expect(lookupCfop('5000')).toMatchObject({ tipo: 'saida', natureza: 'interna' });
        expect(lookupCfop('6000')).toMatchObject({ tipo: 'saida', natureza: 'interestadual' });
        expect(lookupCfop('7000')).toMatchObject({ tipo: 'saida', natureza: 'exterior' });
    });

    it('ignora pontuação/espaços no código', () => {
        expect(lookupCfop(' 5.102 ').descricao).toBe('Venda de mercadoria adquirida ou recebida de terceiros');
    });

    it('retorna objeto vazio quando o 1º dígito não é um sentido válido', () => {
        expect(lookupCfop('9999')).toEqual({});
        expect(lookupCfop('')).toEqual({});
    });
});
