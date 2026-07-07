import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Driver } from 'neo4j-driver';

/** Usuário persistido como nó :Usuario no Neo4j. */
export interface User {
    id: string;
    email: string;
    nome: string;
    criadoEm: string;
}

interface UserWithHash extends User {
    senhaHash: string;
}

const SALT_ROUNDS = 10;

/** Busca um usuário pelo e-mail (com o hash de senha, para login). */
export async function findByEmail(
    driver: Driver,
    email: string,
): Promise<UserWithHash | null> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (u:Usuario {email: $email})
             RETURN u.id AS id, u.email AS email, u.nome AS nome,
                    u.criadoEm AS criadoEm, u.senhaHash AS senhaHash`,
            { email },
        );
        const r = res.records[0];
        if (!r) return null;
        return {
            id: r.get('id') as string,
            email: r.get('email') as string,
            nome: r.get('nome') as string,
            criadoEm: r.get('criadoEm') as string,
            senhaHash: r.get('senhaHash') as string,
        };
    } finally {
        await session.close();
    }
}

/** Busca um usuário pelo id (sem o hash). */
export async function findById(driver: Driver, id: string): Promise<User | null> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (u:Usuario {id: $id})
             RETURN u.id AS id, u.email AS email, u.nome AS nome, u.criadoEm AS criadoEm`,
            { id },
        );
        const r = res.records[0];
        if (!r) return null;
        return {
            id: r.get('id') as string,
            email: r.get('email') as string,
            nome: r.get('nome') as string,
            criadoEm: r.get('criadoEm') as string,
        };
    } finally {
        await session.close();
    }
}

/** Cria um usuário com senha hasheada (idempotente por e-mail via MERGE). */
export async function createUser(
    driver: Driver,
    data: { email: string; nome: string; senha: string },
): Promise<User> {
    const senhaHash = await bcrypt.hash(data.senha, SALT_ROUNDS);
    const id = randomUUID();
    const criadoEm = new Date().toISOString();
    const session = driver.session();
    try {
        const res = await session.run(
            `MERGE (u:Usuario {email: $email})
             ON CREATE SET u.id = $id, u.nome = $nome, u.senhaHash = $senhaHash, u.criadoEm = $criadoEm
             RETURN u.id AS id, u.email AS email, u.nome AS nome, u.criadoEm AS criadoEm`,
            { email: data.email, id, nome: data.nome, senhaHash, criadoEm },
        );
        const r = res.records[0]!;
        return {
            id: r.get('id') as string,
            email: r.get('email') as string,
            nome: r.get('nome') as string,
            criadoEm: r.get('criadoEm') as string,
        };
    } finally {
        await session.close();
    }
}

/** Verifica a senha contra o hash armazenado. */
export async function verifyPassword(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
}

/**
 * Atualiza nome e/ou e-mail do usuário. Garante unicidade do e-mail: se o novo
 * e-mail já pertencer a OUTRO usuário, lança erro (a rota traduz para 409). Só
 * escreve os campos fornecidos. Retorna o usuário atualizado (sem o hash).
 */
export async function updateProfile(
    driver: Driver,
    id: string,
    data: { nome?: string; email?: string },
): Promise<User> {
    const session = driver.session();
    try {
        // Unicidade: e-mail novo não pode estar em uso por outro usuário.
        if (data.email !== undefined) {
            const dup = await session.run(
                `MATCH (u:Usuario {email: $email}) WHERE u.id <> $id RETURN u.id AS id LIMIT 1`,
                { email: data.email, id },
            );
            if (dup.records.length > 0) {
                throw new Error('EMAIL_IN_USE');
            }
        }
        const sets: string[] = [];
        const params: Record<string, unknown> = { id };
        if (data.nome !== undefined) (sets.push('u.nome = $nome'), (params.nome = data.nome));
        if (data.email !== undefined) (sets.push('u.email = $email'), (params.email = data.email));
        if (sets.length === 0) {
            const atual = await findById(driver, id);
            if (!atual) throw new Error('USER_NOT_FOUND');
            return atual;
        }
        const res = await session.run(
            `MATCH (u:Usuario {id: $id})
             SET ${sets.join(', ')}
             RETURN u.id AS id, u.email AS email, u.nome AS nome, u.criadoEm AS criadoEm`,
            params,
        );
        const r = res.records[0];
        if (!r) throw new Error('USER_NOT_FOUND');
        return {
            id: r.get('id') as string,
            email: r.get('email') as string,
            nome: r.get('nome') as string,
            criadoEm: r.get('criadoEm') as string,
        };
    } finally {
        await session.close();
    }
}

/**
 * Troca a senha do usuário, validando a senha atual primeiro. Lança
 * 'WRONG_PASSWORD' se a atual não confere, 'USER_NOT_FOUND' se o id não existe.
 */
export async function updatePassword(
    driver: Driver,
    id: string,
    senhaAtual: string,
    novaSenha: string,
): Promise<void> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (u:Usuario {id: $id}) RETURN u.senhaHash AS senhaHash`,
            { id },
        );
        const r = res.records[0];
        if (!r) throw new Error('USER_NOT_FOUND');
        const ok = await verifyPassword(senhaAtual, r.get('senhaHash') as string);
        if (!ok) throw new Error('WRONG_PASSWORD');
        const novoHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
        await session.run(`MATCH (u:Usuario {id: $id}) SET u.senhaHash = $novoHash`, { id, novoHash });
    } finally {
        await session.close();
    }
}
