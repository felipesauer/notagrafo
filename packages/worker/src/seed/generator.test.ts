import { describe, it, expect } from 'vitest';
import { validateNFe } from '@notagrafo/core';
import { generateNFe, makeRng } from './generator.js';

describe('generateNFe', () => {
    it('gera NFes válidas contra o XSD oficial v4.00', () => {
        const rng = makeRng(7);
        for (let i = 1; i <= 20; i++) {
            const { xml, chaveAcesso } = generateNFe(i, rng);
            expect(chaveAcesso).toHaveLength(44);
            const res = validateNFe(xml);
            expect(res.valid, `NFe ${i} inválida: ${res.errors.join('; ')}`).toBe(true);
        }
    });

    it('é determinístico para o mesmo seed', () => {
        const a = generateNFe(1, makeRng(99));
        const b = generateNFe(1, makeRng(99));
        expect(a.xml).toBe(b.xml);
    });

    it('gera chaves de acesso distintas para notas diferentes', () => {
        const rng = makeRng(3);
        const chaves = new Set<string>();
        for (let i = 1; i <= 50; i++) chaves.add(generateNFe(i, rng).chaveAcesso);
        expect(chaves.size).toBe(50);
    });
});
