import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ReactFlow, Background, Controls, useReactFlow, ReactFlowProvider, type Edge, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '../api/api.client.js';
import { mesclarGrafo, type ApiGrafo, type NoGrafo, type DadosNo } from '../grafo/layout.js';
import { NoCustom } from '../grafo/NoCustom.js';
import { GraphPanel } from '../grafo/GraphPanel.js';
import { useGraphStore, type GraphDirection } from '../stores/graph.store.js';

const nodeTypes = { custom: NoCustom };

function GrafoInterno(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { cnpj?: string };
    const { fitView } = useReactFlow();

    const depth = useGraphStore((s) => s.depth);
    const direction = useGraphStore((s) => s.direction);
    const setDepth = useGraphStore((s) => s.setDepth);
    const setDirection = useGraphStore((s) => s.setDirection);

    const [grafo, setGrafo] = useState<{ nodes: NoGrafo[]; edges: Edge[] }>({ nodes: [], edges: [] });
    const [selecionado, setSelecionado] = useState<DadosNo | null>(null);
    const [buscaInput, setBuscaInput] = useState(search.cnpj ?? '');
    const { nodes, edges } = grafo;

    const carregar = useCallback(async (cnpj: string, grau: number, dir: GraphDirection, mesclar: boolean) => {
        const api = await apiFetch<ApiGrafo>(`/empresa/${cnpj}/grafo?depth=${grau}&direction=${dir}`);
        // setState funcional: lê o grafo atual sem virar dependência (callback estável).
        setGrafo((prev) => mesclarGrafo(mesclar ? prev : { nodes: [], edges: [] }, api, cnpj));
    }, []);

    // ?cnpj= é a fonte de verdade do estado inicial.
    useEffect(() => {
        if (search.cnpj) void carregar(search.cnpj, depth, direction, false);
    }, [search.cnpj, depth, direction, carregar]);

    useEffect(() => {
        if (nodes.length) queueMicrotask(() => fitView({ duration: 300 }));
    }, [nodes.length, fitView]);

    const onNodeClick = useCallback(
        (_e: unknown, node: Node) => {
            const dados = node.data as DadosNo;
            setSelecionado(dados);
            if (dados.cnpj) void carregar(dados.cnpj, 1, direction, true); // expande sem reinicializar
        },
        [carregar, direction],
    );

    function buscar(): void {
        if (buscaInput.trim()) void navigate({ to: '/grafo', search: { cnpj: buscaInput.trim() } });
    }
    function reset(): void {
        setGrafo({ nodes: [], edges: [] });
        setSelecionado(null);
        void navigate({ to: '/grafo', search: {} });
    }
    async function exportarPng(): Promise<void> {
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
                <input placeholder={t('grafo.buscarEmpresa')} value={buscaInput} onChange={(e) => setBuscaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscar()} />
                <button type="button" onClick={buscar}>{t('comum.buscar')}</button>
                <label>
                    {t('grafo.profundidade')}: {depth}
                    <input type="range" min={1} max={4} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
                </label>
                <select value={direction} onChange={(e) => setDirection(e.target.value as GraphDirection)}>
                    <option value="both">{t('grafo.ambos')}</option>
                    <option value="emitente">{t('grafo.emitente')}</option>
                    <option value="destinatario">{t('grafo.destinatario')}</option>
                </select>
                <button type="button" onClick={reset}>{t('grafo.resetar')}</button>
                <button type="button" onClick={() => void exportarPng()}>{t('grafo.exportarPng')}</button>
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
                {selecionado && <GraphPanel no={selecionado} onClose={() => setSelecionado(null)} />}
            </div>
        </div>
    );
}

/** Página de Grafo (React Flow + dagre). Envolvida no provider do React Flow. */
export function GrafoPage(): JSX.Element {
    return (
        <ReactFlowProvider>
            <GrafoInterno />
        </ReactFlowProvider>
    );
}
