import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError, setOnUnauthorized } from './api.client.js';

// localStorage fake (ambiente node).
const store = new Map<string, string>();
beforeEach(() => {
    store.clear();
    vi.restoreAllMocks();
    (globalThis as { localStorage?: unknown }).localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
    };
});

function mockFetch(...responses: Array<{ status: number; body?: unknown }>) {
    const fn = vi.fn();
    for (const r of responses) {
        fn.mockResolvedValueOnce({
            status: r.status,
            ok: r.status >= 200 && r.status < 300,
            json: async () => r.body ?? {},
        });
    }
    globalThis.fetch = fn as unknown as typeof fetch;
    return fn;
}

describe('apiFetch — skipAuthRefresh (NOTA-49)', () => {
    it('401 com skipAuthRefresh propaga o erro REAL sem refresh nem redirect', async () => {
        const onUnauth = vi.fn();
        setOnUnauthorized(onUnauth);
        const fetchFn = mockFetch({ status: 401, body: { error: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' } });

        await expect(apiFetch('/auth/login', { method: 'POST', body: {}, skipAuthRefresh: true })).rejects.toMatchObject({
            status: 401,
            code: 'INVALID_CREDENTIALS',
        });
        // não tentou refresh (1 só fetch) nem redirecionou
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(onUnauth).not.toHaveBeenCalled();
    });

    it('401 SEM a flag tenta refresh e, falhando, redireciona (sessão expirada)', async () => {
        store.set('nfp_token', 'tok-expirado');
        const onUnauth = vi.fn();
        setOnUnauthorized(onUnauth);
        // 1ª chamada: 401; 2ª chamada: refresh falha (401)
        const fetchFn = mockFetch({ status: 401, body: {} }, { status: 401, body: {} });

        await expect(apiFetch('/nf')).rejects.toBeInstanceOf(ApiError);
        expect(fetchFn).toHaveBeenCalledTimes(2); // request + refresh
        expect(onUnauth).toHaveBeenCalledTimes(1);
    });

    it('resposta ok retorna o JSON', async () => {
        mockFetch({ status: 200, body: { pong: true } });
        await expect(apiFetch('/ping')).resolves.toEqual({ pong: true });
    });
});
