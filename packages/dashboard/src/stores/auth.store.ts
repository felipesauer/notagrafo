import { create } from 'zustand';

export interface Usuario {
    id: string;
    email: string;
    nome: string;
}

interface AuthState {
    token: string | null;
    user: Usuario | null;
    isAuthenticated: boolean;
    setSession: (token: string, user: Usuario) => void;
    clear: () => void;
}

const TOKEN_KEY = 'nfp_token';

/**
 * Decodifica o payload do JWT (sub/email/nome) sem verificar assinatura — só para
 * reidratar o usuário na inicialização. Assim o Perfil (Configurações) funciona
 * após reload, quando só o token é persistido. Retorna null se o token for inválido.
 */
function userFromToken(token: string | null): Usuario | null {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as {
            sub?: string; email?: string; nome?: string;
        };
        if (!payload.email) return null;
        return { id: payload.sub ?? '', email: payload.email, nome: payload.nome ?? payload.email };
    } catch {
        return null;
    }
}

const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

/** Store de autenticação — espelha o token no localStorage e reidrata o usuário do JWT. */
export const useAuthStore = create<AuthState>((set) => ({
    token: storedToken,
    user: userFromToken(storedToken),
    isAuthenticated: !!storedToken,
    setSession: (token, user) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
        set({ token, user, isAuthenticated: true });
    },
    clear: () => {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
        set({ token: null, user: null, isAuthenticated: false });
    },
}));
