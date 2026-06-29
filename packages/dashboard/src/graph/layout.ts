import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

/** Tipo de nó no grafo (controla a cor/estilo). */
export type NodeType = 'empresa' | 'notafiscal' | 'produto';

export interface NodeData extends Record<string, unknown> {
    tipo: NodeType;
    label: string;
    cnpj?: string;
    detalhes?: Record<string, unknown>;
}

export type GraphNode = Node<NodeData>;

const W = 160;
const H = 48;

/** Aplica layout hierárquico dagre aos nós, retornando-os com posições. */
export function applyLayout(nodes: GraphNode[], edges: Edge[]): GraphNode[] {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

    for (const n of nodes) g.setNode(n.id, { width: W, height: H });
    for (const e of edges) g.setEdge(e.source, e.target);

    Dagre.layout(g);

    return nodes.map((n) => {
        const pos = g.node(n.id);
        return { ...n, position: { x: pos.x - W / 2, y: pos.y - H / 2 } };
    });
}

interface ApiNode {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
}
interface ApiEdge {
    de: string;
    para: string;
    totalNFs: number;
}
export interface ApiGraph {
    cnpj: string;
    nos: ApiNode[];
    arestas: ApiEdge[];
}

/** Iniciais da razão social para o rótulo do nó Empresa. */
function initials(nome: string): string {
    return nome
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase();
}

/**
 * Converte a resposta de /empresa/:cnpj/grafo em nós e arestas React Flow,
 * mesclando com os já existentes SEM duplicar (por id = cnpj).
 */
export function mergeGraph(
    current: { nodes: GraphNode[]; edges: Edge[] },
    api: ApiGraph,
    rootCnpj: string,
): { nodes: GraphNode[]; edges: Edge[] } {
    const nodesById = new Map(current.nodes.map((n) => [n.id, n]));
    const edgesById = new Map(current.edges.map((e) => [e.id, e]));

    // garante o nó raiz
    if (!nodesById.has(rootCnpj)) {
        nodesById.set(rootCnpj, { id: rootCnpj, position: { x: 0, y: 0 }, data: { tipo: 'empresa', label: rootCnpj.slice(0, 4), cnpj: rootCnpj } });
    }

    for (const node of api.nos) {
        if (!nodesById.has(node.cnpj)) {
            nodesById.set(node.cnpj, {
                id: node.cnpj,
                position: { x: 0, y: 0 },
                data: { tipo: 'empresa', label: initials(node.razaoSocial) || node.cnpj.slice(0, 4), cnpj: node.cnpj, detalhes: { ...node } },
            });
        }
    }

    for (const a of api.arestas) {
        const id = `${a.de}->${a.para}`;
        if (!edgesById.has(id) && nodesById.has(a.de) && nodesById.has(a.para)) {
            edgesById.set(id, { id, source: a.de, target: a.para, label: String(a.totalNFs), markerEnd: { type: 'arrowclosed' } } as Edge);
        }
    }

    const nodes = applyLayout([...nodesById.values()], [...edgesById.values()]);
    return { nodes, edges: [...edgesById.values()] };
}
