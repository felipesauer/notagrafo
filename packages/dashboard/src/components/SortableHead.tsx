import { type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from './ui/table.js';

/**
 * Cabeçalho de coluna ordenável. Clica → ordena (asc→desc→asc); mostra o ícone
 * do estado e reflete em `aria-sort`. Ligado ao useTableSort (client) ou a um
 * controlador server-side equivalente — ambos expõem { ariaSort(key), toggle(key) }.
 *
 * `align='right'` para colunas numéricas (mantém o número colado à direita, com
 * o botão de ordenação à esquerda do rótulo).
 */
export function SortableHead<K extends string>({
    sortKey,
    ariaSort,
    onToggle,
    align = 'left',
    className,
    children,
}: {
    sortKey: K;
    ariaSort: (key: K) => 'ascending' | 'descending' | 'none';
    onToggle: (key: K) => void;
    align?: 'left' | 'right';
    className?: string;
    children: ReactNode;
}): JSX.Element {
    const { t } = useTranslation();
    const state = ariaSort(sortKey);
    const Icon = state === 'ascending' ? ArrowUp : state === 'descending' ? ArrowDown : ChevronsUpDown;
    return (
        <TableHead aria-sort={state} className={className}>
            <button
                type="button"
                onClick={() => onToggle(sortKey)}
                aria-label={t('comum.paginacao.ordenarPor', { coluna: typeof children === 'string' ? children : String(sortKey) })}
                className={`inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${state === 'none' ? 'text-muted-foreground' : 'text-foreground'} ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
                <Icon className={`size-3.5 shrink-0 ${state === 'none' ? 'opacity-40' : ''}`} />
                <span>{children}</span>
            </button>
        </TableHead>
    );
}
