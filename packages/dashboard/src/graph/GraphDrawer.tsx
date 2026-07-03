import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider, MarkerType, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from '../api/api.client.js';
import { mergeGraph, type ApiGraph, type GraphEdge, type GraphNode, type NodeData, type NodeType } from './layout.js';
import { CustomNode } from './CustomNode.js';
import { WeightedEdge } from './WeightedEdge.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet.js';
import { Button } from '../components/ui/button.js';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { weighted: WeightedEdge };
const TIPO_COR_MINIMAP: Record<NodeType, string> = { empresa: '#6ea8fe', notafiscal: '#46c56a', produto: '#e0a83c' };

/** Canvas do grafo (mesma engine da página /grafo), enxuto para o drawer. */
function DrawerCanvas({ cnpj, dark }: { cnpj: string; dark: boolean }): JSX.Element {
    const { fitView } = useReactFlow();
    const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [hovered, setHovered] = useState<string | null>(null);

    const load = useCallback(async (c: string, merge: boolean) => {
        setLoading(true);
        try {
            const [api, root] = await Promise.all([
                apiFetch<ApiGraph>(`/empresa/${c}/grafo?depth=1&direction=both`),
                apiFetch<{ razaoSocial?: string; uf?: string; stats?: { totalNFsEmitidas?: number; totalNFsRecebidas?: number } }>(`/empresa/${c}`).catch(() => null),
            ]);
            const meta = root ? { razaoSocial: root.razaoSocial, uf: root.uf, totalNFs: (root.stats?.totalNFsEmitidas ?? 0) + (root.stats?.totalNFsRecebidas ?? 0) } : undefined;
            setGraph((prev) => mergeGraph(merge ? prev : { nodes: [], edges: [] }, api, c, meta));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(cnpj, false); }, [cnpj, load]);
    useEffect(() => { if (graph.nodes.length) queueMicrotask(() => fitView({ duration: 250, padding: 0.2 })); }, [graph.nodes.length, fitView]);

    const onNodeClick = useCallback((_e: unknown, node: Node) => {
        const d = node.data as NodeData;
        if (d.cnpj && d.cnpj !== cnpj) void load(d.cnpj, true); // expande sem perder o grafo
    }, [cnpj, load]);

    const vizinhanca = useMemo(() => {
        if (!hovered) return null;
        const set = new Set<string>([hovered]);
        for (const e of graph.edges) { if (e.source === hovered) set.add(e.target); if (e.target === hovered) set.add(e.source); }
        return set;
    }, [hovered, graph.edges]);

    const rfNodes = useMemo(() => graph.nodes.map((n) => ({ ...n, type: 'custom', data: { ...n.data, dimmed: vizinhanca ? !vizinhanca.has(n.id) : false } })), [graph.nodes, vizinhanca]);
    const rfEdges = useMemo(() => graph.edges.map((e) => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--muted-foreground)' }, data: { ...e.data, dimmed: vizinhanca ? !(vizinhanca.has(e.source) && vizinhanca.has(e.target)) : false } })), [graph.edges, vizinhanca]);

    return (
        <div className="relative h-full">
            {loading && graph.nodes.length === 0 && (
                <div className="grid h-full place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
            )}
            {graph.nodes.length > 0 && (
                <ReactFlow
                    nodes={rfNodes}
                    edges={rfEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodeClick={onNodeClick}
                    onNodeMouseEnter={(_e, n) => setHovered(n.id)}
                    onNodeMouseLeave={() => setHovered(null)}
                    colorMode={dark ? 'dark' : 'light'}
                    minZoom={0.2}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                >
                    <Background />
                    <Controls showInteractive={false} />
                    <MiniMap pannable className="!rounded-md !border !border-border" style={{ background: 'var(--card)' }} maskColor={dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'} nodeColor={(n) => TIPO_COR_MINIMAP[(n.data as { tipo: NodeType }).tipo] ?? '#888'} />
                </ReactFlow>
            )}
        </div>
    );
}

/**
 * Grafo de relações aberto como painel lateral (Sheet), a partir do detalhe da
 * NF — sem trocar de página, mantendo a NF por baixo. Um link "abrir completo"
 * leva à página /grafo dedicada para exploração ampla.
 */
export function GraphDrawer({ cnpj, open, onOpenChange, dark }: { cnpj: string; open: boolean; onOpenChange: (o: boolean) => void; dark: boolean }): JSX.Element {
    const { t } = useTranslation();
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
                <SheetHeader className="flex-row items-center justify-between gap-2 border-b p-4">
                    <div>
                        <SheetTitle>{t('grafo.tituloDrawer')}</SheetTitle>
                        <SheetDescription>{t('grafo.subtituloDrawer')}</SheetDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mr-8">
                        <Link to={'/grafo' as string} search={{ cnpj } as never} onClick={() => onOpenChange(false)}>
                            <ExternalLink /> {t('grafo.abrirCompleto')}
                        </Link>
                    </Button>
                </SheetHeader>
                <div className="min-h-0 flex-1">
                    {/* provider recriado por abertura (key=cnpj) para resetar o viewport */}
                    {open && (
                        <ReactFlowProvider>
                            <DrawerCanvas key={cnpj} cnpj={cnpj} dark={dark} />
                        </ReactFlowProvider>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
