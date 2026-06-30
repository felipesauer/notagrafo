import { describe, it, expect } from 'vitest';
import { lookupNcm, listNcmChapters } from './ncm.catalog.js';

describe('lookupNcm', () => {
    it('resolve capítulo, descrição e seção de uma NCM conhecida (84 — máquinas)', () => {
        // 84713012 (notebook do seed) → capítulo 84
        expect(lookupNcm('84713012')).toEqual({
            capitulo: '84',
            descricao: 'Máquinas, aparelhos e equipamentos mecânicos',
            secao: 'Máquinas e aparelhos; material elétrico',
        });
    });

    it('resolve os demais capítulos usados no seed (85, 61, 94)', () => {
        expect(lookupNcm('85285200').capitulo).toBe('85');
        expect(lookupNcm('85285200').descricao).toBe('Máquinas, aparelhos e materiais elétricos');
        expect(lookupNcm('61091000').descricao).toBe('Vestuário e seus acessórios, de malha');
        expect(lookupNcm('94013000').descricao).toBe('Móveis; mobiliário médico-cirúrgico; luminárias');
    });

    it('retorna apenas o capítulo quando ele não está no catálogo', () => {
        // capítulo 99 não mapeado
        expect(lookupNcm('99999999')).toEqual({ capitulo: '99' });
    });

    it('ignora pontuação/espaços e usa só os 2 primeiros dígitos', () => {
        expect(lookupNcm('8471.30.12').capitulo).toBe('84');
        expect(lookupNcm('  61 09 10 00 ').capitulo).toBe('61');
    });

    it('retorna capítulo vazio quando o código tem menos de 2 dígitos', () => {
        expect(lookupNcm('8')).toEqual({ capitulo: '8' });
        expect(lookupNcm('')).toEqual({ capitulo: '' });
    });

    it('consistência do catálogo: todo capítulo conhecido resolve descrição e seção', () => {
        // Protege a invariante CAPITULOS → SECOES (todo capítulo aponta para uma seção existente).
        for (const capitulo of listNcmChapters()) {
            const info = lookupNcm(capitulo);
            expect(info.descricao, `capítulo ${capitulo} sem descrição`).toBeTruthy();
            expect(info.secao, `capítulo ${capitulo} com seção inválida`).toBeTruthy();
        }
    });
});
