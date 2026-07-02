import { describe, it, expect } from 'vitest';
import { loggerConfig } from './logger.js';

type RedactConfig = { redact?: { paths: string[]; censor: (v: unknown) => unknown } };

describe('loggerConfig — mascaramento LGPD de CPF', () => {
    it('sem a flag, não configura redact', () => {
        const cfg = loggerConfig({ NODE_ENV: 'production' }) as RedactConfig;
        expect(cfg.redact).toBeUndefined();
    });

    it('com LGPD_MASK_CPF=true, configura redact que mascara CPF e preserva CNPJ', () => {
        const cfg = loggerConfig({ NODE_ENV: 'production', LGPD_MASK_CPF: 'true' }) as RedactConfig;
        expect(cfg.redact).toBeDefined();
        expect(cfg.redact!.paths).toContain('cnpj');
        expect(cfg.redact!.paths).toContain('emitente.cnpj');
        const censor = cfg.redact!.censor;
        expect(censor('12345689100')).toBe('***.***.***-00'); // CPF → mascarado
        expect(censor('12345678000199')).toBe('12345678000199'); // CNPJ → intacto
        expect(censor(42)).toBe(42); // valor não-string → intacto
    });
});
