import { describe, it, expect } from 'vitest';
import type { Driver } from 'neo4j-driver';
import { runMigrations, MIGRATIONS } from './migrations.js';

/**
 * Driver fake que falha as primeiras `failFirst` sessões inteiras (simulando o
 * Neo4j ainda não aceitar conexão de aplicação no boot) e depois funciona.
 * Conta quantas sessões foram abertas para verificar o número de tentativas.
 */
function makeFlakyDriver(failFirst: number) {
    let sessionsOpened = 0;
    const session = () => {
        const mine = ++sessionsOpened;
        return {
            run: async () => {
                if (mine <= failFirst) throw new Error('Connection was closed by server');
                return { records: [] };
            },
            close: async () => {},
        };
    };
    return { driver: { session } as unknown as Driver, get sessionsOpened() { return sessionsOpened; } };
}

describe('runMigrations (unit)', () => {
    it('aplica todas as migrations quando o Neo4j responde de primeira', async () => {
        const runs: string[] = [];
        const driver = {
            session: () => ({
                run: async (cypher: string) => { runs.push(cypher); return { records: [] }; },
                close: async () => {},
            }),
        } as unknown as Driver;
        await runMigrations(driver, { attempts: 3, delayMs: 0 });
        expect(runs).toHaveLength(MIGRATIONS.length);
    });

    it('faz retry e tem sucesso após falhas iniciais de conexão', async () => {
        const flaky = makeFlakyDriver(2); // falha 2 vezes, sucesso na 3ª
        await runMigrations(flaky.driver, { attempts: 5, delayMs: 0 });
        expect(flaky.sessionsOpened).toBe(3); // 2 falhas + 1 sucesso
    });

    it('propaga o erro quando esgota as tentativas', async () => {
        const flaky = makeFlakyDriver(10); // sempre falha
        await expect(runMigrations(flaky.driver, { attempts: 3, delayMs: 0 })).rejects.toThrow(
            'Connection was closed by server',
        );
        expect(flaky.sessionsOpened).toBe(3); // tentou exatamente `attempts` vezes
    });
});
