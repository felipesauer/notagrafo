import { describe, it, expect } from 'vitest';
import { toRgb } from './resolveTheme.js';

describe('toRgb (oklch → hex)', () => {
    it('converte os tokens de gráfico para hex sRGB plausível', () => {
        expect(toRgb('oklch(0.623 0.214 259.815)')).toBe('#2b7fff'); // azul (chart-1)
        expect(toRgb('oklch(0.723 0.219 149.579)')).toBe('#00c950'); // verde (chart-2)
        expect(toRgb('oklch(0.637 0.237 25.331)')).toBe('#fb2c36'); // vermelho (chart-4)
    });

    it('converte neutros (card/foreground) nos dois temas', () => {
        expect(toRgb('oklch(1 0 0)')).toBe('#ffffff'); // card claro
        expect(toRgb('oklch(0.205 0 0)')).toBe('#171717'); // card escuro
        expect(toRgb('oklch(0.985 0 0)')).toBe('#fafafa'); // foreground escuro
    });

    it('aceita L em porcentagem', () => {
        expect(toRgb('oklch(20.5% 0 0)')).toBe('#171717');
    });

    it('deixa passar formatos não-oklch (hex, rgb, nomes)', () => {
        expect(toRgb('#3b82f6')).toBe('#3b82f6');
        expect(toRgb('rgb(59, 130, 246)')).toBe('rgb(59, 130, 246)');
        expect(toRgb('transparent')).toBe('transparent');
    });
});
