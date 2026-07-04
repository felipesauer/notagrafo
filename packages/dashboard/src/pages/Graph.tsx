import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { Download, Loader2, RotateCcw, Search } from 'lucide-react';
import { apiFetch } from '../api/api.client.js';
import { mergeGraph, type ApiGraph, type EdgeData, type GraphEdge, type GraphNode, type NodeData, type NodeType } from '../graph/layout.js';
import { CustomNode } from '../graph/CustomNode.js';
import { WeightedEdge } from '../graph/WeightedEdge.js';
import { GraphPanel } from '../graph/GraphPanel.js';
import { useGraphStore, type GraphDirection } from '../stores/graph.store.js';
import { useThemeStore } from '../stores/theme.store.js';
import { PageHeader } from '../components/PageHeader.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Slider } from '../components/ui/slider.js';
import { Switch } from '../components/ui/switch.js';
import { Card } from '../components/ui/card.js';
import { NativeSelect } from '../components/ui/native-select.js';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { weighted: WeightedEdge };


/** Cor (CSS var) por tipo — para a legenda (CSS resolve a var normalmente). */
const TIPO_COR: Record<NodeType, string> = {
    empresa: 'var(--chart-1)',
    notafiscal: 'var(--chart-2)',
    produto: 'var(--chart-3)',
};
/** Cor concreta por tipo para o MiniMap: seu <canvas> NÃO resolve CSS vars,
 *  então precisa de hex/rgb literais (era a causa do minimap "vazio"). Espelha
 *  as --chart-1..3 do tema claro (NOTA-ADR-13), convertidas pela mesma matemática
 *  OKLab→sRGB do toRgb() em charts/resolveTheme.ts: chart-1 cobalto, 2 esmeralda,
 *  3 âmbar. Ao mudar a paleta em globals.css, recalcular estes 3 hex. */
const TIPO_COR_MINIMAP: Record<NodeType, string> = {
    empresa: '#255ff8',
    notafiscal: '#1ebd5b',
    produto: '#f0a800',
};

function Legenda(): JSX.Element {
    const { t } = useTranslation();
    const itens: [NodeType, string][] = [
        ['empresa', t('empresas.titulo')],
        ['notafiscal', t('sidebar.nfs')],
        ['produto', t('produtos.titulo')],
    ];
    return (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 rounded-md border bg-card/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
            {itens.map(([tipo, label]) => (
                <span key={tipo} className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: TIPO_COR[tipo] }} />
                    {label}
                </span>
            ))}
        </div>
    );
}

function GraphInner(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { cnpj?: string };
    const { fitView } = useReactFlow();
    const tema = useThemeStore((s) => s.tema);

    const depth = useGraphStore((s) => s.depth);
    const direction = useGraphStore((s) => s.direction);
    const includeProdutos = useGraphStore((s) => s.includeProdutos);
    const setDepth = useGraphStore((s) => s.setDepth);
    const setDirection = useGraphStore((s) => s.setDirection);
    const setIncludeProdutos = useGraphStore((s) => s.setIncludeProdutos);

    const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
    const [selected, setSelected] = useState<NodeData | null>(null);
    const [searchInput, setSearchInput] = useState(search.cnpj ?? '');
    const [loading, setLoading] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const { nodes, edges } = graph;

    const load = useCallback(async (cnpj: string, degree: number, dir: GraphDirection, merge: boolean, produtos = false) => {
        const prodParam = produtos ? '&includeProdutos=true' : '';
        setLoading(true);
        try {
            // Busca o grafo e, em paralelo, os dados da empresa-raiz (a API do
            // grafo não inclui a própria raiz em `nos`, então o nó raiz ficaria
            // só com o CNPJ). Falha do /empresa não derruba o grafo.
            const [api, rootMeta] = await Promise.all([
                apiFetch<ApiGraph>(`/empresa/${cnpj}/grafo?depth=${degree}&direction=${dir}${prodParam}`),
                apiFetch<{ razaoSocial?: string; uf?: string; stats?: { totalNFsEmitidas?: number; totalNFsRecebidas?: number } }>(`/empresa/${cnpj}`).catch(() => null),
            ]);
            const meta = rootMeta
                ? { razaoSocial: rootMeta.razaoSocial, uf: rootMeta.uf, totalNFs: (rootMeta.stats?.totalNFsEmitidas ?? 0) + (rootMeta.stats?.totalNFsRecebidas ?? 0) }
                : undefined;
            setGraph((prev) => mergeGraph(merge ? prev : { nodes: [], edges: [] }, api, cnpj, meta));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (search.cnpj) void load(search.cnpj, depth, direction, false, includeProdutos);
    }, [search.cnpj, depth, direction, includeProdutos, load]);

    // Re-enquadra sempre que o CONJUNTO de nós muda (busca, merge, expansão),
    // não só quando a contagem muda. O timeout dá ao React Flow tempo de medir
    // os nós-card antes do fit (senão enquadra em posições ainda não aplicadas
    // e corta os vizinhos). padding folgado para os cards não colarem na borda.
    const nodesKey = useMemo(() => nodes.map((n) => n.id).sort().join('|'), [nodes]);

    const onNodeClick = useCallback(
        (_e: unknown, node: Node) => {
            const data = node.data as NodeData;
            setSelected(data);
            if (data.cnpj) void load(data.cnpj, 1, direction, true, includeProdutos);
        },
        [load, direction, includeProdutos],
    );

    function runSearch(): void {
        if (searchInput.trim()) void navigate({ to: '/grafo', search: { cnpj: searchInput.trim() } });
    }
    function reset(): void {
        setGraph({ nodes: [], edges: [] });
        setSelected(null);
        void navigate({ to: '/grafo', search: {} });
    }
    async function exportPng(): Promise<void> {
        const el = document.querySelector('.react-flow') as HTMLElement | null;
        if (!el) return;
        const dataUrl = await toPng(el);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'grafo.png';
        a.click();
    }

    // Hover-isola: vizinhança do nó sob o mouse (ele + conectados diretos).
    const vizinhanca = useMemo(() => {
        if (!hovered) return null;
        const set = new Set<string>([hovered]);
        for (const e of edges) {
            if (e.source === hovered) set.add(e.target);
            if (e.target === hovered) set.add(e.source);
        }
        return set;
    }, [hovered, edges]);

    // Estado controlado do React Flow: sem isto, os nós (passados como prop)
    // não arrastam de verdade. useNodesState dá o onNodesChange que persiste o
    // drag; ressincronizamos só quando o GRAFO muda (fetch/merge), preservando
    // as posições que o usuário arrastou entre re-renders.
    const [rfNodes, setRfNodes, onNodesChange] = useNodesState<GraphNode>([]);
    const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);

    useEffect(() => {
        setRfNodes(nodes.map((n) => ({ ...n, type: 'custom' })));
        setRfEdges(edges.map((e) => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--muted-foreground)' } })));
    }, [nodes, edges, setRfNodes, setRfEdges]);

    // Hover-isola: atualiza só o `dimmed` (não mexe em posição — o drag fica intacto).
    useEffect(() => {
        setRfNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, dimmed: vizinhanca ? !vizinhanca.has(n.id) : false } })));
        setRfEdges((es) => es.map((e) => {
            const dim = vizinhanca ? !(vizinhanca.has(e.source) && vizinhanca.has(e.target)) : false;
            return { ...e, data: { ...(e.data as EdgeData), dimmed: dim } };
        }));
    }, [vizinhanca, setRfNodes, setRfEdges]);

    // Enquadra após os nós entrarem no estado controlado do React Flow — só quando
    // o CONJUNTO muda (fetch), nunca no drag (arrastar não altera a contagem).
    useEffect(() => {
        if (!nodesKey || rfNodes.length === 0) return;
        const id = setTimeout(() => void fitView({ padding: 0.22, duration: 450, maxZoom: 1.15 }), 180);
        return () => clearTimeout(id);
    }, [nodesKey, rfNodes.length, fitView]);

    return (
        <div className="flex h-[calc(100vh-8.5rem)] flex-col">
            <PageHeader
                title={t('sidebar.grafo')}
                actions={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={reset}><RotateCcw /> {t('grafo.resetar')}</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void exportPng()} disabled={nodes.length === 0}><Download /> {t('grafo.exportPng')}</Button>
                    </>
                }
            />

            <Card className="mb-4 flex flex-row flex-wrap items-center gap-3 px-4 py-3">
                <div className="relative min-w-56 flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('grafo.buscarEmpresa')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        className="h-9 pl-8"
                    />
                </div>
                <Button type="button" size="sm" onClick={runSearch}>{t('comum.buscar')}</Button>
                <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap text-xs text-muted-foreground">{t('grafo.profundidade')}: {depth}</Label>
                    <Slider className="w-28" min={1} max={4} step={1} value={[depth]} onValueChange={([v]) => setDepth(v ?? 1)} />
                </div>
                <NativeSelect value={direction} onChange={(e) => setDirection(e.target.value as GraphDirection)} wrapperClassName="w-40">
                    <option value="both">{t('grafo.ambos')}</option>
                    <option value="emitente">{t('grafo.emitente')}</option>
                    <option value="destinatario">{t('grafo.destinatario')}</option>
                </NativeSelect>
                <Label className="flex items-center gap-2 text-xs">
                    <Switch checked={includeProdutos} onCheckedChange={setIncludeProdutos} />
                    {t('grafo.incluirProdutos')}
                </Label>
            </Card>

            <Card className="relative flex-1 overflow-hidden py-0">
                {nodes.length === 0 ? (
                    <div className="grid h-full place-items-center text-sm text-muted-foreground">
                        {loading ? <Loader2 className="size-6 animate-spin" /> : t('grafo.vazio')}
                    </div>
                ) : (
                    <>
                        {loading && (
                            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border bg-card/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
                                <Loader2 className="size-3.5 animate-spin" /> {t('comum.carregando')}
                            </div>
                        )}
                        <Legenda />
                        <ReactFlow
                            nodes={rfNodes}
                            edges={rfEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            onNodeClick={onNodeClick}
                            onNodeMouseEnter={(_e, n) => setHovered(n.id)}
                            onNodeMouseLeave={() => setHovered(null)}
                            colorMode={tema === 'escuro' ? 'dark' : 'light'}
                            minZoom={0.2}
                            nodesDraggable
                            fitView
                            fitViewOptions={{ padding: 0.3 }}
                        >
                            <Background />
                            <Controls />
                            <MiniMap
                                pannable
                                zoomable
                                className="!rounded-md !border !border-border"
                                style={{ background: 'var(--card)' }}
                                maskColor={tema === 'escuro' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'}
                                nodeColor={(n) => TIPO_COR_MINIMAP[(n.data as { tipo: NodeType }).tipo] ?? '#888'}
                                nodeStrokeWidth={3}
                            />
                        </ReactFlow>
                        {selected && <GraphPanel node={selected} onClose={() => setSelected(null)} />}
                    </>
                )}
            </Card>
        </div>
    );
}

/** Página de Grafo (React Flow + dagre). Envolvida no provider do React Flow. */
export function GraphPage(): JSX.Element {
    return (
        <ReactFlowProvider>
            <GraphInner />
        </ReactFlowProvider>
    );
}
