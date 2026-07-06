import { create } from 'zustand';

export type GraphDirection = 'emitente' | 'destinatario' | 'both';

interface GraphState {
    /** CNPJ raiz do grafo (fonte de verdade vinda da URL ?cnpj=). */
    cnpj: string | null;
    depth: number; // 1..4
    direction: GraphDirection;
    includeProdutos: boolean; // mostra os produtos da empresa-raiz como nós
    includeNotas: boolean; // mostra as NF-e trocadas como nós
    setCnpj: (cnpj: string | null) => void;
    setDepth: (depth: number) => void;
    setDirection: (direction: GraphDirection) => void;
    setIncludeProdutos: (v: boolean) => void;
    setIncludeNotas: (v: boolean) => void;
    reset: () => void;
}

/** Store de estado da página de Grafo. Produtos ligados por padrão — sem eles o
 *  grafo ego fica pobre (só empresas); NF-e ficam opt-in (podem adensar). */
export const useGraphStore = create<GraphState>((set) => ({
    cnpj: null,
    depth: 1,
    direction: 'both',
    includeProdutos: true,
    includeNotas: false,
    setCnpj: (cnpj) => set({ cnpj }),
    setDepth: (depth) => set({ depth: Math.min(4, Math.max(1, depth)) }),
    setDirection: (direction) => set({ direction }),
    setIncludeProdutos: (includeProdutos) => set({ includeProdutos }),
    setIncludeNotas: (includeNotas) => set({ includeNotas }),
    reset: () => set({ cnpj: null, depth: 1, direction: 'both', includeProdutos: true, includeNotas: false }),
}));
