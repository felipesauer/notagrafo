import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider, type Edge, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { Download, Loader2, RotateCcw, Search } from 'lucide-react';
import { apiFetch } from '../api/api.client.js';
import { mergeGraph, type ApiGraph, type GraphNode, type NodeData, type NodeType } from '../graph/layout.js';
import { CustomNode } from '../graph/CustomNode.js';
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

const nodeTypes = { custom: CustomNode };

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Cor (CSS var) por tipo de nó — casa com CustomNode; usada na legenda e no MiniMap. */
const TIPO_COR: Record<NodeType, string> = {
    empresa: 'var(--chart-1)',
    notafiscal: 'var(--chart-2)',
    produto: 'var(--chart-3)',
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

    const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
    const [selected, setSelected] = useState<NodeData | null>(null);
    const [searchInput, setSearchInput] = useState(search.cnpj ?? '');
    const [loading, setLoading] = useState(false);
    const { nodes, edges } = graph;

    const load = useCallback(async (cnpj: string, degree: number, dir: GraphDirection, merge: boolean, produtos = false) => {
        const prodParam = produtos ? '&includeProdutos=true' : '';
        setLoading(true);
        try {
            const api = await apiFetch<ApiGraph>(`/empresa/${cnpj}/grafo?depth=${degree}&direction=${dir}${prodParam}`);
            setGraph((prev) => mergeGraph(merge ? prev : { nodes: [], edges: [] }, api, cnpj));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (search.cnpj) void load(search.cnpj, depth, direction, false, includeProdutos);
    }, [search.cnpj, depth, direction, includeProdutos, load]);

    useEffect(() => {
        if (nodes.length) queueMicrotask(() => fitView({ duration: 300 }));
    }, [nodes.length, fitView]);

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

    const rfNodes = useMemo(() => nodes.map((n) => ({ ...n, type: 'custom' })), [nodes]);

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
                <select value={direction} onChange={(e) => setDirection(e.target.value as GraphDirection)} className={selectClass}>
                    <option value="both">{t('grafo.ambos')}</option>
                    <option value="emitente">{t('grafo.emitente')}</option>
                    <option value="destinatario">{t('grafo.destinatario')}</option>
                </select>
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
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodeClick={onNodeClick}
                            colorMode={tema === 'escuro' ? 'dark' : 'light'}
                            fitView
                        >
                            <Background />
                            <Controls />
                            <MiniMap pannable zoomable nodeColor={(n) => TIPO_COR[(n.data as { tipo: NodeType }).tipo] ?? 'var(--muted)'} />
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
