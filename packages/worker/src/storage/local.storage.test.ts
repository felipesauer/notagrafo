import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalXmlStorage } from './local.storage.js';
import { createXmlStorage } from './factory.js';

const tmp = mkdtempSync(join(tmpdir(), 'nfp-xml-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const CHAVE = '35200114200166000187550010000000071234567890';

describe('LocalXmlStorage', () => {
    it('salva e recupera o XML', async () => {
        const storage = new LocalXmlStorage(tmp);
        const xml = '<NFe>conteudo</NFe>';

        const ref = await storage.save(CHAVE, xml);
        expect(ref).toContain(`${CHAVE}.xml`);

        const lido = await storage.get(CHAVE);
        expect(lido.toString('utf8')).toBe(xml);
    });

    it('exists reflete a presença do arquivo', async () => {
        const storage = new LocalXmlStorage(tmp);
        expect(await storage.exists('00000000000000000000000000000000000000000000')).toBe(false);
        await storage.save(CHAVE, '<x/>');
        expect(await storage.exists(CHAVE)).toBe(true);
    });
});

describe('createXmlStorage (factory)', () => {
    it('driver=local instancia LocalXmlStorage', () => {
        const s = createXmlStorage({ XML_STORAGE_DRIVER: 'local', XML_STORAGE_LOCAL_PATH: tmp });
        expect(s).toBeInstanceOf(LocalXmlStorage);
    });

    it('driver inválido lança erro', () => {
        expect(() => createXmlStorage({ XML_STORAGE_DRIVER: 'foo' })).toThrow(/inválido/);
    });
});
