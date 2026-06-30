import { describe, it, expect } from 'vitest';
import { validateNFe, parseNFe } from '@notagrafo/core';
import { generateNFe, makeRng } from './generator.js';

const IMPORTADO_EM = new Date('2026-06-26T12:00:00Z');

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

    it('gera impostos não-zero, multi-item e algum ICMS-ST ao longo do lote', () => {
        const rng = makeRng(42);
        let temImposto = false;
        let temMultiItem = false;
        let temST = false;
        for (let i = 1; i <= 30; i++) {
            const p = parseNFe(generateNFe(i, rng).xml, IMPORTADO_EM);
            if ((p.totais.vICMS ?? 0) > 0 && (p.totais.vIPI ?? 0) > 0) temImposto = true;
            if (p.itens.length > 1) temMultiItem = true;
            if (p.itens.some((it) => (it.contem.vICMSST ?? 0) > 0)) temST = true;
        }
        expect(temImposto, 'esperava NF com ICMS e IPI > 0').toBe(true);
        expect(temMultiItem, 'esperava NF com mais de 1 item').toBe(true);
        expect(temST, 'esperava NF com ICMS-ST > 0').toBe(true);
    });

    it('gera NF de devolução válida com finalidade devolucao e NFref', () => {
        const venda = generateNFe(1, makeRng(5));
        const dev = generateNFe(99, makeRng(5), { devolucaoRef: venda.chaveAcesso });
        const res = validateNFe(dev.xml);
        expect(res.valid, `devolução inválida: ${res.errors.join('; ')}`).toBe(true);
        const p = parseNFe(dev.xml, IMPORTADO_EM);
        expect(p.nota.finalidade).toBe('devolucao');
        expect(p.referencias).toEqual([venda.chaveAcesso]);
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
