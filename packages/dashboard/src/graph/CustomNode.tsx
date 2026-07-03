import { type JSX } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, FileText, Package } from 'lucide-react';
import { BaseNode, BaseNodeContent } from '../components/base-node.js';
import { cn } from '../lib/utils.js';
import type { NodeData, NodeType } from './layout.js';

/** Cor (CSS var) + ícone por tipo de nó. */
const TIPO = {
    empresa: { color: 'var(--chart-1)', Icon: Building2 },
    notafiscal: { color: 'var(--chart-2)', Icon: FileText },
    produto: { color: 'var(--chart-3)', Icon: Package },
} satisfies Record<NodeType, { color: string; Icon: typeof Building2 }>;

/**
 * Nó-card do grafo (via BaseNode oficial do React Flow): avatar colorido por
 * tipo + razão social + linha de contexto (UF · nº de NF-e). A raiz do ego-graph
 * ganha um anel de destaque; nós fora da vizinhança do hover ficam esmaecidos.
 */
export function CustomNode({ data, selected, sourcePosition, targetPosition }: NodeProps): JSX.Element {
    const d = data as NodeData;
    const { color, Icon } = TIPO[d.tipo];
    const isRoot = d.relacao === 'raiz';
    const contexto = [d.uf, d.totalNFs != null ? `${d.totalNFs} NF-e` : null].filter(Boolean).join(' · ');

    return (
        <BaseNode
            className={cn(
                'w-[210px] gap-0 p-0 transition-opacity',
                (isRoot || selected) && 'ring-2 ring-offset-2 ring-offset-background',
                d.dimmed && 'opacity-30',
            )}
            style={isRoot || selected ? ({ '--tw-ring-color': color } as React.CSSProperties) : undefined}
        >
            {/* Um handle de cada tipo; a POSIÇÃO vem do nó (targetPosition/
                sourcePosition), que o layout radial define apontando para o centro
                — assim as arestas saem/entram pelo lado certo, sem laço. */}
            <Handle type="target" position={targetPosition ?? Position.Left} className="!border-0 !bg-transparent" />
            <Handle type="source" position={sourcePosition ?? Position.Right} className="!border-0 !bg-transparent" />
            <BaseNodeContent className="flex-row items-center gap-2.5 p-2.5">
                <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-white [&>svg]:size-4.5"
                    style={{ background: color }}
                >
                    <Icon />
                </span>
                <div className="min-w-0 leading-tight">
                    <p className="truncate text-[13px] font-semibold" title={d.razaoSocial ?? d.label}>
                        {d.razaoSocial ?? d.label}
                    </p>
                    {contexto && <p className="truncate text-[11px] text-muted-foreground">{contexto}</p>}
                </div>
            </BaseNodeContent>
            <Handle type="source" position={Position.Right} className="!bg-border" />
        </BaseNode>
    );
}
