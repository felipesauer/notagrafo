import { type JSX } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeType } from './layout.js';

/** Cor (CSS var) e tamanho do nó por tipo — tokenizado (NOTA-94). */
const STYLES: Record<NodeType, { color: string; size: number }> = {
    empresa: { color: 'var(--chart-1)', size: 56 },
    notafiscal: { color: 'var(--chart-2)', size: 44 },
    produto: { color: 'var(--chart-3)', size: 44 },
};

/** Nó customizado do grafo: círculo colorido por tipo, com label e tooltip. */
export function CustomNode({ data, selected }: NodeProps): JSX.Element {
    const d = data as { tipo: NodeType; label: string; cnpj?: string };
    const style = STYLES[d.tipo];
    return (
        <div
            title={d.cnpj ?? d.label}
            className={`grid place-items-center rounded-full border-2 border-white/40 text-center text-xs font-semibold text-white shadow-sm transition-shadow ${
                selected ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''
            }`}
            style={{ background: style.color, width: style.size, height: style.size }}
        >
            <Handle type="target" position={Position.Left} />
            <span className="px-1 leading-tight">{d.label}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
