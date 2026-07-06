import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
    key: K | null;
    direction: SortDirection;
}

/** Valor de `aria-sort` para o cabeçalho de coluna, dado o estado de ordenação. */
export function ariaSortFor<K extends string>(state: SortState<K>, key: K): 'ascending' | 'descending' | 'none' {
    if (state.key !== key) return 'none';
    return state.direction === 'asc' ? 'ascending' : 'descending';
}

/**
 * Ordena `rows` conforme `sort` — função pura (testável sem React). Ausentes vão
 * para o fim; comparação numérica quando ambos os lados são número, senão
 * localeCompare pt-BR numérico. Retorna `rows` inalterado quando não há coluna.
 */
export function sortRows<T, K extends string>(
    rows: readonly T[],
    sort: SortState<K>,
    accessors: Record<K, (row: T) => string | number | null | undefined>,
): readonly T[] {
    if (!sort.key) return rows;
    const accessor = accessors[sort.key];
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        const va = accessor(a);
        const vb = accessor(b);
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
        return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * factor;
    });
}

/**
 * Ordenação client-side de tabelas top-N totalmente carregadas (Empresas,
 * Produtos, rankings de Impostos, Últimas NFs, itens da NF — NOTA-ADR-9/16).
 * A lista de NFs NÃO usa isto: pagina por cursor e ordena SERVER-SIDE via
 * orderBy/order (que o /nf aceita) — ordenar só o buffer local seria enganoso.
 *
 * `accessors` mapeia cada chave de coluna ordenável ao valor comparável da linha.
 * Clicar na mesma coluna alterna asc→desc; clicar em outra começa em asc.
 * Comparação numérica quando ambos os lados são número, senão localeCompare pt-BR.
 */
export function useTableSort<T, K extends string>(
    rows: readonly T[],
    accessors: Record<K, (row: T) => string | number | null | undefined>,
    initial: SortState<NoInfer<K>> = { key: null, direction: 'asc' },
) {
    const [sort, setSort] = useState<SortState<K>>(initial);

    function toggle(key: K): void {
        setSort((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    }

    const sorted = useMemo(() => sortRows(rows, sort, accessors), [rows, sort, accessors]);

    return { sorted, sort, toggle, ariaSort: (key: K) => ariaSortFor(sort, key) };
}
