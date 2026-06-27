import { type JSX } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TipoNo } from './layout.js';

const ESTILOS: Record<TipoNo, { bg: string; size: number }> = {
    empresa: { bg: '#2563eb', size: 56 },
    notafiscal: { bg: '#16a34a', size: 44 },
    produto: { bg: '#ea580c', size: 44 },
};

/** Nó customizado do grafo: círculo colorido por tipo, com label e tooltip. */
export function NoCustom({ data }: NodeProps): JSX.Element {
    const d = data as { tipo: TipoNo; label: string; cnpj?: string };
    const estilo = ESTILOS[d.tipo];
    return (
        <div
            title={d.cnpj ?? d.label}
            className="grafo-no"
            style={{ background: estilo.bg, width: estilo.size, height: estilo.size }}
        >
            <Handle type="target" position={Position.Left} />
            <span>{d.label}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
