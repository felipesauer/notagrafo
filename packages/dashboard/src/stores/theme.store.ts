import { create } from 'zustand';

export type Tema = 'claro' | 'escuro';

interface ThemeState {
    tema: Tema;
    setTema: (tema: Tema) => void;
    toggle: () => void;
}

const THEME_KEY = 'nfp_tema';

/** Tema inicial: o salvo, senão o de prefers-color-scheme. */
function temaInicial(): Tema {
    if (typeof localStorage !== 'undefined') {
        const salvo = localStorage.getItem(THEME_KEY);
        if (salvo === 'claro' || salvo === 'escuro') return salvo;
    }
    const prefereEscuro =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
    return prefereEscuro ? 'escuro' : 'claro';
}

function aplicar(tema: Tema): void {
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = tema;
    }
}

/** Store de tema claro/escuro, persistido e aplicado ao <html data-theme>. */
export const useThemeStore = create<ThemeState>((set, get) => {
    const inicial = temaInicial();
    aplicar(inicial);
    return {
        tema: inicial,
        setTema: (tema) => {
            if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, tema);
            aplicar(tema);
            set({ tema });
        },
        toggle: () => get().setTema(get().tema === 'claro' ? 'escuro' : 'claro'),
    };
});
