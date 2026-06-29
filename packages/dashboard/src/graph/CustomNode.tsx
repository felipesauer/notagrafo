import { type JSX } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeType } from './layout.js';

const STYLES: Record<NodeType, { bg: string; size: number }> = {
    empresa: { bg: '#2563eb', size: 56 },
    notafiscal: { bg: '#16a34a', size: 44 },
    produto: { bg: '#ea580c', size: 44 },
};

/** Nó customizado do grafo: círculo colorido por tipo, com label e tooltip. */
export function CustomNode({ data }: NodeProps): JSX.Element {
    const d = data as { tipo: NodeType; label: string; cnpj?: string };
    const style = STYLES[d.tipo];
    return (
        <div
            title={d.cnpj ?? d.label}
            className="grafo-no"
            style={{ background: style.bg, width: style.size, height: style.size }}
        >
            <Handle type="target" position={Position.Left} />
            <span>{d.label}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
