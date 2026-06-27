import { create } from 'zustand';

export type GraphDirection = 'emitente' | 'destinatario' | 'both';

interface GraphState {
    /** CNPJ raiz do grafo (fonte de verdade vinda da URL ?cnpj=). */
    cnpj: string | null;
    depth: number; // 1..4
    direction: GraphDirection;
    setCnpj: (cnpj: string | null) => void;
    setDepth: (depth: number) => void;
    setDirection: (direction: GraphDirection) => void;
    reset: () => void;
}

/** Store de estado da página de Grafo. */
export const useGraphStore = create<GraphState>((set) => ({
    cnpj: null,
    depth: 1,
    direction: 'both',
    setCnpj: (cnpj) => set({ cnpj }),
    setDepth: (depth) => set({ depth: Math.min(4, Math.max(1, depth)) }),
    setDirection: (direction) => set({ direction }),
    reset: () => set({ cnpj: null, depth: 1, direction: 'both' }),
}));
