import { describe, it, expect } from 'vitest';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { buscarPorEmail, buscarPorId, criarUsuario, verificarSenha } from './user.repository.js';

describe('user.repository (unit, driver fake)', () => {
    it('buscarPorEmail retorna o usuário com hash, ou null', async () => {
        const f = makeFakeDriver(() => [rec({ id: 'u1', email: 'a@b.com', nome: 'A', criadoEm: 'x', senhaHash: 'h' })]);
        const u = await buscarPorEmail(f.driver, 'a@b.com');
        expect(u).toMatchObject({ id: 'u1', senhaHash: 'h' });
        expect(f.runs[0]!.params.email).toBe('a@b.com');

        const vazio = makeFakeDriver(() => []);
        expect(await buscarPorEmail(vazio.driver, 'x')).toBeNull();
    });

    it('buscarPorId retorna sem hash, ou null', async () => {
        const f = makeFakeDriver(() => [rec({ id: 'u1', email: 'a', nome: 'A', criadoEm: 'x' })]);
        const u = await buscarPorId(f.driver, 'u1');
        expect(u).toEqual({ id: 'u1', email: 'a', nome: 'A', criadoEm: 'x' });
        expect(u).not.toHaveProperty('senhaHash');

        const vazio = makeFakeDriver(() => []);
        expect(await buscarPorId(vazio.driver, 'nope')).toBeNull();
    });

    it('criarUsuario hasheia a senha e usa MERGE por e-mail', async () => {
        const f = makeFakeDriver((_c, p) => [rec({ id: p.id, email: p.email, nome: p.nome, criadoEm: p.criadoEm })]);
        const u = await criarUsuario(f.driver, { email: 'a@b.com', nome: 'A', senha: 'segredo' });
        expect(u.email).toBe('a@b.com');
        // a senha não vai em texto puro nos params; vai um hash bcrypt
        const hash = f.runs[0]!.params.senhaHash as string;
        expect(hash).not.toBe('segredo');
        expect(await verificarSenha('segredo', hash)).toBe(true);
        expect(f.runs[0]!.cypher).toContain('MERGE (u:Usuario {email: $email})');
    });

    it('verificarSenha distingue senha certa de errada', async () => {
        const f = makeFakeDriver((_c, p) => [rec({ id: p.id, email: p.email, nome: p.nome, criadoEm: p.criadoEm })]);
        await criarUsuario(f.driver, { email: 'a', nome: 'A', senha: 'certa' });
        const hash = f.runs[0]!.params.senhaHash as string;
        expect(await verificarSenha('errada', hash)).toBe(false);
    });
});
