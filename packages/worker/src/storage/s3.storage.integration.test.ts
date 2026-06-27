import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { MinioContainer, type StartedMinioContainer } from '@testcontainers/minio';
import { S3XmlStorage } from './s3.storage.js';

let container: StartedMinioContainer;
let storage: S3XmlStorage;

const BUCKET = 'notagrafo';
const CHAVE = '35200114200166000187550010000000071234567890';

beforeAll(async () => {
    container = await new MinioContainer('minio/minio:latest').start();
    const endpoint = container.getConnectionUrl();
    const creds = { accessKeyId: container.getUsername(), secretAccessKey: container.getPassword() };

    // cria o bucket antes de usar
    const client = new S3Client({
        endpoint,
        region: 'us-east-1',
        forcePathStyle: true,
        credentials: creds,
    });
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));

    storage = new S3XmlStorage({
        bucket: BUCKET,
        endpoint,
        region: 'us-east-1',
        forcePathStyle: true,
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
    });
}, 120_000);

afterAll(async () => {
    await container?.stop();
});

describe('S3XmlStorage (MinIO real)', () => {
    it('salva e recupera o XML', async () => {
        const xml = '<NFe>conteudo minio</NFe>';
        const ref = await storage.save(CHAVE, xml);
        expect(ref).toBe(`s3://${BUCKET}/${CHAVE}.xml`);

        const lido = await storage.get(CHAVE);
        expect(lido.toString('utf8')).toBe(xml);
    });

    it('exists reflete a presença do objeto', async () => {
        expect(await storage.exists('11111111111111111111111111111111111111111111')).toBe(false);
        await storage.save(CHAVE, '<x/>');
        expect(await storage.exists(CHAVE)).toBe(true);
    });
});
