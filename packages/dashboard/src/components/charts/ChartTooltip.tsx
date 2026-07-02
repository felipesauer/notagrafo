import { type JSX, type ReactNode } from 'react';
import { type NameType, type ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface TooltipEntry {
    name?: NameType;
    value?: ValueType;
    color?: string;
    dataKey?: string | number;
}

/**
 * Conteúdo de tooltip estilizado com os tokens do tema (popover), usado no lugar
 * do default do Recharts para casar com o resto do design (ADR-8). Passar como
 * `content={<ChartTooltip formatValue={...} />}` num <Tooltip> do Recharts —
 * o Recharts injeta `active`/`payload`/`label` em runtime.
 */
export function ChartTooltip({
    active,
    payload,
    label,
    formatValue,
    formatLabel,
}: {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: ReactNode;
    /** Formata o valor de cada série (ex.: moeda BRL). */
    formatValue?: (value: ValueType | undefined, name: NameType | undefined) => ReactNode;
    /** Formata o rótulo do eixo (ex.: período). */
    formatLabel?: (label: ReactNode) => ReactNode;
}): JSX.Element | null {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
            {label != null && label !== '' && (
                <div className="mb-1 font-medium">{formatLabel ? formatLabel(label) : label}</div>
            )}
            <ul className="space-y-0.5">
                {payload.map((entry, i) => (
                    <li key={entry.dataKey ?? i} className="flex items-center gap-2 tabular-nums">
                        <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-[3px]"
                            style={{ background: entry.color }}
                        />
                        {entry.name != null && <span className="text-muted-foreground">{entry.name}</span>}
                        <span className="ml-auto font-medium">
                            {formatValue ? formatValue(entry.value, entry.name) : String(entry.value ?? '')}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
