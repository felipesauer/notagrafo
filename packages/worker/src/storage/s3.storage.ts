import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    HeadObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
    type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { objectKey, type XmlStorage } from './xml.storage.js';

export interface S3StorageConfig {
    bucket: string;
    region?: string;
    /** Endpoint customizado — define MinIO (S3-compatível) quando presente. */
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /** MinIO exige path-style; AWS usa virtual-hosted-style. */
    forcePathStyle?: boolean;
}

/** Storage de XML em S3 (AWS) ou MinIO (S3-compatível via endpoint). */
export class S3XmlStorage implements XmlStorage {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(config: S3StorageConfig) {
        this.bucket = config.bucket;
        const clientConfig: S3ClientConfig = {
            ...(config.region ? { region: config.region } : { region: 'us-east-1' }),
            ...(config.endpoint ? { endpoint: config.endpoint } : {}),
            ...(config.forcePathStyle ? { forcePathStyle: true } : {}),
            ...(config.accessKeyId && config.secretAccessKey
                ? {
                      credentials: {
                          accessKeyId: config.accessKeyId,
                          secretAccessKey: config.secretAccessKey,
                      },
                  }
                : {}),
        };
        this.client = new S3Client(clientConfig);
    }

    private bucketGarantido?: Promise<void>;

    /** Garante que o bucket existe (cria se ausente). Idempotente, roda uma vez. */
    private garantirBucket(): Promise<void> {
        this.bucketGarantido ??= (async () => {
            try {
                await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
            } catch {
                try {
                    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
                } catch (err) {
                    // corrida: outro processo pode ter criado entre o head e o create
                    const name = (err as { name?: string }).name;
                    if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') throw err;
                }
            }
        })();
        return this.bucketGarantido;
    }

    async save(chaveAcesso: string, xml: Buffer | string): Promise<string> {
        await this.garantirBucket();
        const key = objectKey(chaveAcesso);
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: typeof xml === 'string' ? Buffer.from(xml) : xml,
                ContentType: 'application/xml',
            }),
        );
        return `s3://${this.bucket}/${key}`;
    }

    async get(chaveAcesso: string): Promise<Buffer> {
        const res = await this.client.send(
            new GetObjectCommand({ Bucket: this.bucket, Key: objectKey(chaveAcesso) }),
        );
        const bytes = await res.Body!.transformToByteArray();
        return Buffer.from(bytes);
    }

    async exists(chaveAcesso: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey(chaveAcesso) }),
            );
            return true;
        } catch {
            return false;
        }
    }
}
