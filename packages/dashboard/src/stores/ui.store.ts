import { create } from 'zustand';

interface UIState {
    /** Sidebar expandida (mostra rótulos) vs. rail fino só de ícones. Persistida. */
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
    /** Drawer de navegação mobile aberto (Sheet). Efêmero. */
    mobileNavOpen: boolean;
    setMobileNav: (open: boolean) => void;
    /** Painel de Insights aberto. Persistido; default = aberto em telas largas. */
    insightsOpen: boolean;
    toggleInsights: () => void;
}

const SB_KEY = 'nfp_sidebar_expanded';
const IN_KEY = 'nfp_insights_open';

function readBool(key: string, fallback: boolean): boolean {
    if (typeof localStorage === 'undefined') return fallback;
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
}

/** Default do Insights: aberto em telas ≥1280px (a não ser que o usuário já tenha escolhido). */
function insightsInicial(): boolean {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(IN_KEY) !== null) {
        return localStorage.getItem(IN_KEY) === '1';
    }
    return typeof matchMedia !== 'undefined' ? matchMedia('(min-width: 1280px)').matches : false;
}

/** Estado transversal de UI (chrome): expansão da sidebar, drawer mobile e painel de Insights. */
export const useUIStore = create<UIState>((set, get) => ({
    sidebarExpanded: readBool(SB_KEY, false),
    toggleSidebar: () => {
        const next = !get().sidebarExpanded;
        if (typeof localStorage !== 'undefined') localStorage.setItem(SB_KEY, next ? '1' : '0');
        set({ sidebarExpanded: next });
    },
    mobileNavOpen: false,
    setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
    insightsOpen: insightsInicial(),
    toggleInsights: () => {
        const next = !get().insightsOpen;
        if (typeof localStorage !== 'undefined') localStorage.setItem(IN_KEY, next ? '1' : '0');
        set({ insightsOpen: next });
    },
}));
