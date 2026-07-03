import { type JSX, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from './ui/table.js';

/**
 * Cabeçalho de coluna ordenável: botão com aria-sort e ícone indicando a direção.
 * `aria-sort` vem de useTableSort.ariaSort(key). Usado nas tabelas top-N
 * (Empresas, Produtos, rankings de Impostos — NOTA-ADR-9).
 */
export function SortableHead({
    children,
    ariaSort,
    onToggle,
    align = 'left',
}: {
    children: ReactNode;
    ariaSort: 'ascending' | 'descending' | 'none';
    onToggle: () => void;
    align?: 'left' | 'right';
}): JSX.Element {
    const Icon = ariaSort === 'ascending' ? ArrowUp : ariaSort === 'descending' ? ArrowDown : ArrowUpDown;
    return (
        <TableHead aria-sort={ariaSort} className={align === 'right' ? 'text-right' : undefined}>
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-1 font-medium hover:text-foreground ${
                    ariaSort === 'none' ? 'text-muted-foreground' : 'text-foreground'
                } ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
                {children}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}
