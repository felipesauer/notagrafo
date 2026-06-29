const TOKEN_KEY = 'nfp_token';
const BASE = '/api/v1';

export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}
function setToken(token: string): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
}
function clearToken(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

/** Redireciona para /login (sobrescritível em testes). */
let onUnauthorized = (): void => {
    if (typeof window !== 'undefined') window.location.assign('/login');
};
export function setOnUnauthorized(fn: () => void): void {
    onUnauthorized = fn;
}

/** Tenta renovar o token via /auth/refresh. Retorna o novo token ou null. */
async function tentarRefresh(): Promise<string | null> {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token: string };
    setToken(data.token);
    return data.token;
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    /** Interno: marca que já tentamos refresh nesta requisição. */
    _retried?: boolean;
    /**
     * Não tratar 401 como sessão expirada (sem refresh/redirect). Usar em rotas
     * de autenticação (login/refresh), onde 401 = credencial inválida e deve
     * propagar o erro real para a UI.
     */
    skipAuthRefresh?: boolean;
}

/**
 * Cliente HTTP da API. Anexa o JWT do localStorage. Em 401, tenta refresh
 * UMA vez; se o refresh falhar, limpa o token e redireciona a /login.
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
        method: opts.method ?? 'GET',
        headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });

    // 401 em rotas de auth (login/refresh) = credencial inválida → propaga o erro real
    // (NÃO faz refresh/redirect, que é o tratamento de sessão expirada).
    if (res.status === 401 && !opts._retried && !opts.skipAuthRefresh) {
        const novo = await tentarRefresh();
        if (novo) {
            return apiFetch<T>(path, { ...opts, _retried: true });
        }
        clearToken();
        onUnauthorized();
        throw new ApiError(401, 'UNAUTHORIZED', 'Sessão expirada.');
    }

    if (!res.ok) {
        const erro = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new ApiError(res.status, erro.error ?? 'ERROR', erro.message ?? res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
