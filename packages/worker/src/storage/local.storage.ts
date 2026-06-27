import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { objectKey, type XmlStorage } from './xml.storage.js';

/** Storage de XML em filesystem local (XML_STORAGE_LOCAL_PATH). */
export class LocalXmlStorage implements XmlStorage {
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = resolve(basePath);
    }

    private pathFor(chaveAcesso: string): string {
        return join(this.basePath, objectKey(chaveAcesso));
    }

    async save(chaveAcesso: string, xml: Buffer | string): Promise<string> {
        const path = this.pathFor(chaveAcesso);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, xml);
        return path;
    }

    async get(chaveAcesso: string): Promise<Buffer> {
        return readFile(this.pathFor(chaveAcesso));
    }

    async exists(chaveAcesso: string): Promise<boolean> {
        try {
            await access(this.pathFor(chaveAcesso));
            return true;
        } catch {
            return false;
        }
    }
}
