import { LocalXmlStorage } from './local.storage.js';
import { S3XmlStorage } from './s3.storage.js';
import type { XmlStorage, XmlStorageDriver } from './xml.storage.js';

/**
 * Cria o XmlStorage conforme XML_STORAGE_DRIVER (local | s3 | minio).
 * Padrão: minio. Variáveis conforme .env.example.
 */
export function createXmlStorage(env: NodeJS.ProcessEnv = process.env): XmlStorage {
    const driver = (env.XML_STORAGE_DRIVER ?? 'minio') as XmlStorageDriver;

    switch (driver) {
        case 'local':
            return new LocalXmlStorage(env.XML_STORAGE_LOCAL_PATH ?? './data/xml');

        case 's3':
            return new S3XmlStorage({
                bucket: requireEnv(env, 'XML_STORAGE_S3_BUCKET'),
                ...(env.XML_STORAGE_S3_REGION ? { region: env.XML_STORAGE_S3_REGION } : {}),
                ...(env.XML_STORAGE_S3_ACCESS_KEY ? { accessKeyId: env.XML_STORAGE_S3_ACCESS_KEY } : {}),
                ...(env.XML_STORAGE_S3_SECRET_KEY ? { secretAccessKey: env.XML_STORAGE_S3_SECRET_KEY } : {}),
            });

        case 'minio':
            return new S3XmlStorage({
                bucket: env.XML_STORAGE_S3_BUCKET ?? 'notagrafo',
                endpoint: env.XML_STORAGE_MINIO_ENDPOINT ?? 'http://localhost:9000',
                accessKeyId: env.XML_STORAGE_MINIO_ACCESS_KEY ?? 'minioadmin',
                secretAccessKey: env.XML_STORAGE_MINIO_SECRET_KEY ?? 'minioadmin',
                forcePathStyle: true,
                region: 'us-east-1',
            });

        default:
            throw new Error(`XML_STORAGE_DRIVER inválido: ${driver} (use local | s3 | minio).`);
    }
}

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
    const v = env[key];
    if (!v) throw new Error(`Variável ${key} obrigatória para o driver de storage.`);
    return v;
}
