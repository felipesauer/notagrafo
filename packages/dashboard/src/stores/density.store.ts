import { create } from 'zustand';

export type Density = 'compacta' | 'padrao' | 'espacada';

interface DensityState {
    density: Density;
    setDensity: (d: Density) => void;
}

const KEY = 'nfp_densidade';
const VALID: Density[] = ['compacta', 'padrao', 'espacada'];

function inicial(): Density {
    if (typeof localStorage !== 'undefined') {
        const salvo = localStorage.getItem(KEY);
        if (salvo && (VALID as string[]).includes(salvo)) return salvo as Density;
    }
    return 'padrao';
}

/**
 * Densidade global das tabelas do Explorer (redesign BI, NOTA-121). Persistida em
 * localStorage; o DensityToggle no header do Explorer a controla e as tabelas a
 * consomem via a classe utilitária `densityClass()` no <table> (o padding das
 * células responde por seletor de descendente definido em globals.css).
 */
export const useDensityStore = create<DensityState>((set) => ({
    density: inicial(),
    setDensity: (density) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, density);
        set({ density });
    },
}));

/** Classe a aplicar no <table> conforme a densidade. */
export function densityClass(d: Density): string {
    return d === 'compacta' ? 'd-compact' : d === 'espacada' ? 'd-relaxed' : '';
}
