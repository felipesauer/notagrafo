import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { chartColor } from './palette.js';

export interface BarItem {
    /** chave única (React key). */
    id: string;
    /** rótulo principal da linha. */
    label: string;
    /** valor que dimensiona a barra (0..max). */
    value: number;
    /** tag curta à esquerda (ex.: UF). Opcional. */
    tag?: string;
    /** texto secundário à direita (ex.: valor em R$). Opcional. */
    hint?: string;
    /** destino do drill-through (search da URL). Opcional. */
    to?: string;
    search?: Record<string, unknown>;
    ariaLabel?: string;
}

/**
 * Lista de barras horizontais reutilizável (redesign BI, NOTA-120) — consolida os
 * padrões UfBars/FornecedorBars da Overview. Cada linha pode ser um drill-through
 * (vira <Link> quando `to` é dado). A barra é dimensionada pela fração value/max;
 * `colorByIndex` cicla a paleta categórica (bom para UFs), senão usa uma cor fixa.
 */
export function BarList({
    items,
    colorByIndex = false,
    fixedColor = 'var(--chart-3)',
    formatValue,
}: {
    items: BarItem[];
    colorByIndex?: boolean;
    fixedColor?: string;
    /** rótulo mostrado DENTRO da barra (só quando há `tag`, estilo UF). */
    formatValue?: (v: number) => string;
}): JSX.Element {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div className="space-y-1">
            {items.map((it, i) => {
                const color = colorByIndex ? chartColor(i) : fixedColor;
                const w = `${Math.max((it.value / max) * 100, it.tag ? 14 : 4)}%`;
                const inner = it.tag ? (
                    // variante densa "UF": tag | barra-com-valor-dentro | hint
                    <>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">{it.tag}</span>
                        <div className="h-6 overflow-hidden rounded bg-muted/50">
                            <div className="flex h-full items-center justify-end rounded pr-2 text-[11px] font-semibold tabular-nums text-white" style={{ width: w, background: color }}>
                                {formatValue ? formatValue(it.value) : it.value}
                            </div>
                        </div>
                        {it.hint && <span className="text-right text-xs tabular-nums text-muted-foreground/70">{it.hint}</span>}
                    </>
                ) : (
                    // variante "ranking": rótulo + barra-fina embaixo | hint à direita
                    <>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{it.label}</p>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/50">
                                <div className="h-full rounded-full" style={{ width: w, background: color }} />
                            </div>
                        </div>
                        {it.hint && <span className="shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{it.hint}</span>}
                    </>
                );

                const gridCls = it.tag ? 'grid-cols-[32px_1fr_88px]' : 'grid-cols-[1fr_auto]';
                const base = `grid ${gridCls} items-center gap-3 rounded-md px-1 py-1 transition-colors`;

                return it.to ? (
                    <Link
                        key={it.id}
                        to={it.to as never}
                        search={it.search as never}
                        aria-label={it.ariaLabel}
                        className={`${base} hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none`}
                    >
                        {inner}
                    </Link>
                ) : (
                    <div key={it.id} className={base}>{inner}</div>
                );
            })}
        </div>
    );
}
