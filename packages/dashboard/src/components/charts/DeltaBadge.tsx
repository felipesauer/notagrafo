import { type JSX } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Badge de variação percentual (delta) com cor semântica: verde para alta,
 * vermelho para queda, neutro para zero. `value` é a fração (0.125 = +12,5%).
 * `invert` inverte a semântica (ex.: carga tributária subindo é "ruim").
 */
export function DeltaBadge({ value, invert = false }: { value: number; invert?: boolean }): JSX.Element {
    const zero = Math.abs(value) < 0.0005;
    const up = value > 0;
    const good = zero ? false : invert ? !up : up;
    const Icon = zero ? Minus : up ? ArrowUpRight : ArrowDownRight;
    const pct = `${up ? '+' : ''}${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-full py-0.5 pl-1 pr-2 text-xs font-semibold tabular-nums',
                zero
                    ? 'bg-muted text-muted-foreground'
                    : good
                        ? 'bg-status-ativa/15 text-status-ativa'
                        : 'bg-status-cancelada/15 text-status-cancelada',
            )}
        >
            <Icon className="size-3.5" />
            {pct}
        </span>
    );
}
