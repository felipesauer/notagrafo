import { describe, it, expect } from 'vitest';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { findByEmail, findById, createUser, verifyPassword } from './user.repository.js';

describe('user.repository (unit, driver fake)', () => {
    it('findByEmail retorna o usuário com hash, ou null', async () => {
        const f = makeFakeDriver(() => [rec({ id: 'u1', email: 'a@b.com', nome: 'A', criadoEm: 'x', senhaHash: 'h' })]);
        const u = await findByEmail(f.driver, 'a@b.com');
        expect(u).toMatchObject({ id: 'u1', senhaHash: 'h' });
        expect(f.runs[0]!.params.email).toBe('a@b.com');

        const vazio = makeFakeDriver(() => []);
        expect(await findByEmail(vazio.driver, 'x')).toBeNull();
    });

    it('findById retorna sem hash, ou null', async () => {
        const f = makeFakeDriver(() => [rec({ id: 'u1', email: 'a', nome: 'A', criadoEm: 'x' })]);
        const u = await findById(f.driver, 'u1');
        expect(u).toEqual({ id: 'u1', email: 'a', nome: 'A', criadoEm: 'x' });
        expect(u).not.toHaveProperty('senhaHash');

        const vazio = makeFakeDriver(() => []);
        expect(await findById(vazio.driver, 'nope')).toBeNull();
    });

    it('createUser hasheia a senha e usa MERGE por e-mail', async () => {
        const f = makeFakeDriver((_c, p) => [rec({ id: p.id, email: p.email, nome: p.nome, criadoEm: p.criadoEm })]);
        const u = await createUser(f.driver, { email: 'a@b.com', nome: 'A', senha: 'segredo' });
        expect(u.email).toBe('a@b.com');
        // a senha não vai em texto puro nos params; vai um hash bcrypt
        const hash = f.runs[0]!.params.senhaHash as string;
        expect(hash).not.toBe('segredo');
        expect(await verifyPassword('segredo', hash)).toBe(true);
        expect(f.runs[0]!.cypher).toContain('MERGE (u:Usuario {email: $email})');
    });

    it('verifyPassword distingue senha certa de errada', async () => {
        const f = makeFakeDriver((_c, p) => [rec({ id: p.id, email: p.email, nome: p.nome, criadoEm: p.criadoEm })]);
        await createUser(f.driver, { email: 'a', nome: 'A', senha: 'certa' });
        const hash = f.runs[0]!.params.senhaHash as string;
        expect(await verifyPassword('errada', hash)).toBe(false);
    });
});
