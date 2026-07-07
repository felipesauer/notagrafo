import { type JSX } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { EdgeData } from './layout.js';

const brlCompact = (v: number): string =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

/**
 * Aresta com PESO e DIREÇÃO: espessura proporcional ao valor agregado da
 * relação (faixa 1.5–6px, escala log para não achatar). O rótulo "N NF-e · R$"
 * só aparece quando a aresta está `focado` (hover no nó) — sem hover os rótulos
 * ficam ocultos para não amontoar no centro do grafo. Esmaece com `data.dimmed`.
 */
export function WeightedEdge({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data,
}: EdgeProps): JSX.Element {
    const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    const d = (data ?? {}) as EdgeData;
    const valor = d.valorTotal ?? 0;
    // Escala log: R$100 → ~1.5px, R$1M → ~6px. Evita que valores altos dominem.
    const width = valor > 0 ? Math.min(6, Math.max(1.5, 1.5 + Math.log10(valor) * 0.9)) : 1.5;
    const dim = d.dimmed ?? false;
    const rotulo = d.totalNFs != null ? `${d.totalNFs} NF-e${valor ? ` · ${brlCompact(valor)}` : ''}` : valor ? brlCompact(valor) : '';

    return (
        <>
            <BaseEdge
                path={path}
                markerEnd={markerEnd}
                style={{ strokeWidth: width, stroke: 'var(--muted-foreground)', opacity: dim ? 0.12 : 0.55, transition: 'opacity .15s' }}
            />
            {rotulo && d.focado && (
                <EdgeLabelRenderer>
                    <div
                        className="pointer-events-none absolute rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-3xs font-medium text-muted-foreground tabular-nums shadow-sm backdrop-blur"
                        style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
                    >
                        {rotulo}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
