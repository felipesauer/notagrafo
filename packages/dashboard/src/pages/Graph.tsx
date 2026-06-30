import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ReactFlow, Background, Controls, useReactFlow, ReactFlowProvider, type Edge, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '../api/api.client.js';
import { mergeGraph, type ApiGraph, type GraphNode, type NodeData } from '../graph/layout.js';
import { CustomNode } from '../graph/CustomNode.js';
import { GraphPanel } from '../graph/GraphPanel.js';
import { useGraphStore, type GraphDirection } from '../stores/graph.store.js';

const nodeTypes = { custom: CustomNode };

function GraphInner(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { cnpj?: string };
    const { fitView } = useReactFlow();

    const depth = useGraphStore((s) => s.depth);
    const direction = useGraphStore((s) => s.direction);
    const includeProdutos = useGraphStore((s) => s.includeProdutos);
    const setDepth = useGraphStore((s) => s.setDepth);
    const setDirection = useGraphStore((s) => s.setDirection);
    const setIncludeProdutos = useGraphStore((s) => s.setIncludeProdutos);

    const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
    const [selected, setSelected] = useState<NodeData | null>(null);
    const [searchInput, setSearchInput] = useState(search.cnpj ?? '');
    const { nodes, edges } = graph;

    const load = useCallback(async (cnpj: string, degree: number, dir: GraphDirection, merge: boolean, produtos = false) => {
        const prodParam = produtos ? '&includeProdutos=true' : '';
        const api = await apiFetch<ApiGraph>(`/empresa/${cnpj}/grafo?depth=${degree}&direction=${dir}${prodParam}`);
        // setState funcional: lê o grafo atual sem virar dependência (callback estável).
        setGraph((prev) => mergeGraph(merge ? prev : { nodes: [], edges: [] }, api, cnpj));
    }, []);

    // ?cnpj= é a fonte de verdade do estado inicial.
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
            // expande sem reinicializar, respeitando o toggle de produtos
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
        <div className="grafo-page">
            <div className="toolbar">
                <input placeholder={t('grafo.buscarEmpresa')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
                <button type="button" onClick={runSearch}>{t('comum.buscar')}</button>
                <label>
                    {t('grafo.profundidade')}: {depth}
                    <input type="range" min={1} max={4} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
                </label>
                <select value={direction} onChange={(e) => setDirection(e.target.value as GraphDirection)}>
                    <option value="both">{t('grafo.ambos')}</option>
                    <option value="emitente">{t('grafo.emitente')}</option>
                    <option value="destinatario">{t('grafo.destinatario')}</option>
                </select>
                <label className="grafo-toggle">
                    <input type="checkbox" checked={includeProdutos} onChange={(e) => setIncludeProdutos(e.target.checked)} />
                    {t('grafo.incluirProdutos')}
                </label>
                <button type="button" onClick={reset}>{t('grafo.resetar')}</button>
                <button type="button" onClick={() => void exportPng()}>{t('grafo.exportPng')}</button>
            </div>

            <div className="grafo-area">
                {nodes.length === 0 ? (
                    <p className="empty-state">{t('grafo.vazio')}</p>
                ) : (
                    <ReactFlow nodes={rfNodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={onNodeClick} fitView>
                        <Background />
                        <Controls />
                    </ReactFlow>
                )}
                {selected && <GraphPanel node={selected} onClose={() => setSelected(null)} />}
            </div>
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
