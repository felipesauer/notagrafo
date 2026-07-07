import { useMemo, useState } from 'react';
import { useTableSort, type SortState } from './useTableSort.js';

/**
 * Ordenação + paginação CLIENT-SIDE sobre um array já carregado — base das
 * tabelas top-N (rankings, Últimas NFs, itens da NF, histórico de exports), que
 * não têm ordenação/paginação server-side (ADR NOTA-ADR-16).
 *
 * Combina useTableSort (ordena) com um cursor de página simples. Ao trocar o
 * tamanho de página ou a ordenação, volta para a primeira página.
 */
export function useClientTable<T, K extends string>(
    rows: readonly T[],
    accessors: Record<K, (row: T) => string | number | null | undefined>,
    opts: { initialSort?: SortState<NoInfer<K>>; initialPageSize?: number } = {},
) {
    const { sorted, sort, toggle: toggleBase, ariaSort } = useTableSort(rows, accessors, opts.initialSort);
    const [pageSize, setPageSizeState] = useState(opts.initialPageSize ?? 10);
    const [page, setPage] = useState(0);

    const total = sorted.length;
    const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    const safePage = Math.min(page, lastPage);
    const pageRows = useMemo(
        () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
        [sorted, safePage, pageSize],
    );

    // Trocar ordenação ou page size reancora na primeira página.
    function toggle(key: K): void {
        toggleBase(key);
        setPage(0);
    }
    function setPageSize(n: number): void {
        setPageSizeState(n);
        setPage(0);
    }

    return {
        pageRows,
        sort,
        toggle,
        ariaSort,
        pagination: {
            page: safePage,
            pageSize,
            total,
            hasPrev: safePage > 0,
            hasNext: safePage < lastPage,
            onPrev: () => setPage((p) => Math.max(0, p - 1)),
            onNext: () => setPage((p) => p + 1),
            onPageSize: setPageSize,
        },
    };
}
