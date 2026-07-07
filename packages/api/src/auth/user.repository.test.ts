import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { findByEmail, findById, createUser, verifyPassword, updateProfile, updatePassword } from './user.repository.js';

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

    it('updateProfile altera nome/email quando o e-mail é único', async () => {
        // 1ª query = dup-check (WHERE u.id <> $id) → vazio; 2ª = SET → retorna atualizado.
        const f = makeFakeDriver((c, p) =>
            c.includes('u.id <> $id') ? [] : [rec({ id: p.id, email: p.email, nome: p.nome, criadoEm: 'x' })],
        );
        const u = await updateProfile(f.driver, 'u1', { nome: 'Novo', email: 'novo@b.com' });
        expect(u).toMatchObject({ id: 'u1', nome: 'Novo', email: 'novo@b.com' });
        expect(f.runs.some((r) => r.cypher.includes('SET'))).toBe(true);
    });

    it('updateProfile rejeita e-mail já em uso por outro usuário', async () => {
        // dup-check retorna um registro → e-mail em uso.
        const f = makeFakeDriver((c) => (c.includes('u.id <> $id') ? [rec({ id: 'outro' })] : []));
        await expect(updateProfile(f.driver, 'u1', { email: 'ocupado@b.com' })).rejects.toThrow('EMAIL_IN_USE');
        // não deve ter chegado a rodar o SET
        expect(f.runs.some((r) => r.cypher.includes('SET'))).toBe(false);
    });

    it('updatePassword troca a senha quando a atual confere', async () => {
        const hashAtual = await bcrypt.hash('atual123', 10);
        const f = makeFakeDriver((c) => (c.includes('RETURN u.senhaHash') ? [rec({ senhaHash: hashAtual })] : []));
        await updatePassword(f.driver, 'u1', 'atual123', 'nova456');
        const setRun = f.runs.find((r) => r.cypher.includes('SET u.senhaHash'));
        expect(setRun).toBeDefined();
        // o novo hash bate com a nova senha (e não com a antiga)
        const novoHash = setRun!.params.novoHash as string;
        expect(await verifyPassword('nova456', novoHash)).toBe(true);
        expect(await verifyPassword('atual123', novoHash)).toBe(false);
    });

    it('updatePassword rejeita quando a senha atual está errada', async () => {
        const hashAtual = await bcrypt.hash('atual123', 10);
        const f = makeFakeDriver((c) => (c.includes('RETURN u.senhaHash') ? [rec({ senhaHash: hashAtual })] : []));
        await expect(updatePassword(f.driver, 'u1', 'errada', 'nova456')).rejects.toThrow('WRONG_PASSWORD');
        expect(f.runs.some((r) => r.cypher.includes('SET u.senhaHash'))).toBe(false);
    });
});
