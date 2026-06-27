import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Driver } from 'neo4j-driver';

/** Usuário persistido como nó :Usuario no Neo4j. */
export interface Usuario {
    id: string;
    email: string;
    nome: string;
    criadoEm: string;
}

interface UsuarioComHash extends Usuario {
    senhaHash: string;
}

const SALT_ROUNDS = 10;

/** Busca um usuário pelo e-mail (com o hash de senha, para login). */
export async function buscarPorEmail(
    driver: Driver,
    email: string,
): Promise<UsuarioComHash | null> {
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
export async function buscarPorId(driver: Driver, id: string): Promise<Usuario | null> {
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
export async function criarUsuario(
    driver: Driver,
    dados: { email: string; nome: string; senha: string },
): Promise<Usuario> {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    const id = randomUUID();
    const criadoEm = new Date().toISOString();
    const session = driver.session();
    try {
        const res = await session.run(
            `MERGE (u:Usuario {email: $email})
             ON CREATE SET u.id = $id, u.nome = $nome, u.senhaHash = $senhaHash, u.criadoEm = $criadoEm
             RETURN u.id AS id, u.email AS email, u.nome AS nome, u.criadoEm AS criadoEm`,
            { email: dados.email, id, nome: dados.nome, senhaHash, criadoEm },
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
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
}
