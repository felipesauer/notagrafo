import { useCallback, useSyncExternalStore } from 'react';

/** Uma view salva: um estado de exploração nomeado (entidade + filtros). */
export interface SavedView {
    id: string;
    nome: string;
    entity: string;
    q?: string;
    status?: string;
}

const KEY = 'notagrafo_saved_views';

function read(): SavedView[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as SavedView[]) : [];
    } catch {
        return [];
    }
}

// store mínimo com subscribe para o useSyncExternalStore reagir entre componentes
const listeners = new Set<() => void>();
let cache: SavedView[] = read();
function emit(next: SavedView[]): void {
    cache = next;
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
}
function subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
}

/** Views salvas persistidas em localStorage, com add/remove reativos. */
export function useSavedViews(): { views: SavedView[]; add: (v: Omit<SavedView, 'id'>) => void; remove: (id: string) => void } {
    const views = useSyncExternalStore(subscribe, () => cache, () => cache);
    const add = useCallback((v: Omit<SavedView, 'id'>) => {
        // id estável por conteúdo evita duplicar a mesma view
        const id = `${v.entity}:${v.q ?? ''}:${v.status ?? ''}:${v.nome}`;
        if (cache.some((x) => x.id === id)) return;
        emit([...cache, { ...v, id }]);
    }, []);
    const remove = useCallback((id: string) => emit(cache.filter((x) => x.id !== id)), []);
    return { views, add, remove };
}
