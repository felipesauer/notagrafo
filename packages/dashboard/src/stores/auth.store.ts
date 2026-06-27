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

/** Store de autenticação — espelha o token no localStorage (nfp_token). */
export const useAuthStore = create<AuthState>((set) => ({
    token: typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
    user: null,
    isAuthenticated: typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY),
    setSession: (token, user) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
        set({ token, user, isAuthenticated: true });
    },
    clear: () => {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
        set({ token: null, user: null, isAuthenticated: false });
    },
}));
