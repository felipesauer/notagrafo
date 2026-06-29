import { describe, it, expect } from 'vitest';
import { configFromEnv, createDriver, getDriver, closeDriver } from './driver.js';

describe('configFromEnv (unit)', () => {
    it('lê NEO4J_* do ambiente', () => {
        expect(configFromEnv({ NEO4J_URI: 'bolt://x', NEO4J_USER: 'u', NEO4J_PASSWORD: 'p' })).toEqual({
            uri: 'bolt://x',
            user: 'u',
            password: 'p',
        });
    });

    it('lança quando falta alguma variável', () => {
        expect(() => configFromEnv({ NEO4J_URI: 'bolt://x' })).toThrow(/NEO4J_/);
        expect(() => configFromEnv({})).toThrow();
    });
});

describe('createDriver / getDriver (unit)', () => {
    // neo4j.driver é lazy: não conecta até a 1ª query, então criar é seguro sem rede.
    const cfg = { uri: 'bolt://localhost:7687', user: 'neo4j', password: 'x' };

    it('createDriver devolve um Driver com close()', async () => {
        const d = createDriver(cfg);
        expect(typeof d.close).toBe('function');
        await d.close();
    });

    it('getDriver é singleton e closeDriver o descarta', async () => {
        process.env.NEO4J_URI = cfg.uri;
        process.env.NEO4J_USER = cfg.user;
        process.env.NEO4J_PASSWORD = cfg.password;
        const a = getDriver();
        const b = getDriver();
        expect(a).toBe(b); // mesma instância
        await closeDriver();
        const c = getDriver();
        expect(c).not.toBe(a); // recriado após close
        await closeDriver();
    });
});
