import { describe, it, expect, vi } from 'vitest';
import { S3XmlStorage } from './s3.storage.js';

/** Acessa o client interno para espionar `send` (sem rede). */
function withSend(storage: S3XmlStorage, impl: (cmd: { constructor: { name: string } }) => unknown) {
    const client = (storage as unknown as { client: { send: unknown } }).client;
    client.send = vi.fn(async (cmd: { constructor: { name: string } }) => impl(cmd));
    return client.send as ReturnType<typeof vi.fn>;
}

const make = () => new S3XmlStorage({ bucket: 'b', endpoint: 'http://minio:9000', accessKeyId: 'k', secretAccessKey: 's', forcePathStyle: true });

describe('S3XmlStorage (unit, client mockado)', () => {
    it('save garante o bucket (HeadBucket ok) e faz PutObject; retorna s3://', async () => {
        const s = make();
        const send = withSend(s, () => ({}));
        const ref = await s.save('CHAVE', '<xml/>');
        expect(ref).toMatch(/^s3:\/\/b\//);
        const comandos = send.mock.calls.map((c) => (c[0] as { constructor: { name: string } }).constructor.name);
        expect(comandos).toContain('HeadBucketCommand');
        expect(comandos).toContain('PutObjectCommand');
    });

    it('save cria o bucket quando HeadBucket falha', async () => {
        const s = make();
        const send = withSend(s, (cmd) => {
            if (cmd.constructor.name === 'HeadBucketCommand') throw new Error('not found');
            return {};
        });
        await s.save('CHAVE', Buffer.from('<xml/>'));
        const comandos = send.mock.calls.map((c) => (c[0] as { constructor: { name: string } }).constructor.name);
        expect(comandos).toContain('CreateBucketCommand');
    });

    it('exists → true quando HeadObject responde, false quando lança', async () => {
        const s1 = make();
        withSend(s1, () => ({}));
        expect(await s1.exists('CHAVE')).toBe(true);

        const s2 = make();
        withSend(s2, () => {
            throw new Error('404');
        });
        expect(await s2.exists('CHAVE')).toBe(false);
    });

    it('get baixa o objeto e devolve Buffer', async () => {
        const s = make();
        withSend(s, () => ({ Body: { transformToByteArray: async () => new Uint8Array([60, 120, 62]) } }));
        const buf = await s.get('CHAVE');
        expect(buf).toBeInstanceOf(Buffer);
        expect(buf.toString()).toBe('<x>');
    });
});
