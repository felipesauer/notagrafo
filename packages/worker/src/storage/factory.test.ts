import { describe, it, expect } from 'vitest';
import { createXmlStorage } from './factory.js';
import { LocalXmlStorage } from './local.storage.js';
import { S3XmlStorage } from './s3.storage.js';

describe('createXmlStorage (unit)', () => {
    it('driver local → LocalXmlStorage', () => {
        const s = createXmlStorage({ XML_STORAGE_DRIVER: 'local', XML_STORAGE_LOCAL_PATH: '/tmp/x' });
        expect(s).toBeInstanceOf(LocalXmlStorage);
    });

    it('driver s3 exige bucket; com bucket → S3XmlStorage', () => {
        expect(() => createXmlStorage({ XML_STORAGE_DRIVER: 's3' })).toThrow(/XML_STORAGE_S3_BUCKET/);
        const s = createXmlStorage({ XML_STORAGE_DRIVER: 's3', XML_STORAGE_S3_BUCKET: 'b' });
        expect(s).toBeInstanceOf(S3XmlStorage);
    });

    it('driver minio (default) → S3XmlStorage', () => {
        expect(createXmlStorage({})).toBeInstanceOf(S3XmlStorage);
        expect(createXmlStorage({ XML_STORAGE_DRIVER: 'minio' })).toBeInstanceOf(S3XmlStorage);
    });

    it('driver inválido → erro', () => {
        expect(() => createXmlStorage({ XML_STORAGE_DRIVER: 'foo' })).toThrow(/inválido/);
    });
});
