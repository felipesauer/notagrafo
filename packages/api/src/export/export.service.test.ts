import { describe, it, expect } from 'vitest';
import type { Driver } from 'neo4j-driver';
import { ExportService } from './export.service.js';

// Driver fake: o teste de TTL não chega a executar query (forçamos o job a ready).
const fakeDriver = {} as Driver;

describe('ExportService — TTL/expiração', () => {
    it('um export já pronto além do TTL retorna "expired" (→ 410)', async () => {
        const service = new ExportService(fakeDriver, 0); // TTL 0h
        const job = service.criar('csv');
        // força o estado ready com expiresAt no passado
        Object.assign(job, { status: 'ready', expiresAt: Date.now() - 1000, filePath: undefined });

        const r = await service.obter(job.exportId);
        expect(r).toBe('expired');

        // após expirar, o job é removido → 404 (null)
        expect(await service.obter(job.exportId)).toBeNull();
    });

    it('contentType mapeia o formato', () => {
        const service = new ExportService(fakeDriver);
        expect(service.contentType('csv')).toContain('text/csv');
        expect(service.contentType('json')).toContain('application/json');
        expect(service.contentType('xlsx')).toContain('spreadsheetml');
    });
});
