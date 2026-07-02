import { describe, it, expect, afterEach, vi } from 'vitest';
import { isCpfMaskingEnabled } from './lgpd-config.js';

afterEach(() => vi.unstubAllEnvs());

describe('isCpfMaskingEnabled', () => {
    it('ativo apenas quando VITE_LGPD_MASK_CPF === "true"', () => {
        vi.stubEnv('VITE_LGPD_MASK_CPF', 'true');
        expect(isCpfMaskingEnabled()).toBe(true);
    });

    it('desativado por padrão (flag ausente)', () => {
        vi.stubEnv('VITE_LGPD_MASK_CPF', undefined as unknown as string);
        expect(isCpfMaskingEnabled()).toBe(false);
    });

    it('desativado para qualquer valor diferente de "true"', () => {
        vi.stubEnv('VITE_LGPD_MASK_CPF', 'false');
        expect(isCpfMaskingEnabled()).toBe(false);
        vi.stubEnv('VITE_LGPD_MASK_CPF', '1');
        expect(isCpfMaskingEnabled()).toBe(false);
    });
});
