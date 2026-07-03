import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

/** Tipo de nó no grafo (controla a cor/estilo). */
export type NodeType = 'empresa' | 'notafiscal' | 'produto';

export interface NodeData extends Record<string, unknown> {
    tipo: NodeType;
    label: string;
    cnpj?: string;
    /** Campos ricos para o nó-card (empresa). */
    razaoSocial?: string;
    uf?: string;
    totalNFs?: number;
    relacao?: string;
    /** Marcado em runtime pelo hover-isola: nó fora da vizinhança do focado. */
    dimmed?: boolean;
    detalhes?: Record<string, unknown>;
}

export interface EdgeData extends Record<string, unknown> {
    /** Valor agregado da relação (peso → espessura da aresta). */
    valorTotal?: number;
    totalNFs?: number;
    dimmed?: boolean;
}

export type GraphNode = Node<NodeData>;
export type GraphEdge = Edge<EdgeData>;

// Card maior que o círculo antigo → precisa de mais espaço no layout.
const W = 210;
const H = 62;

/**
 * Layout hierárquico dagre. rankdir LR com ranksep generoso para o grafo
 * respirar (antes ficava espremido). nodesep maior evita cards colados.
 */
export function applyLayout(nodes: GraphNode[], edges: Edge[]): GraphNode[] {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 28, ranksep: 140, marginx: 24, marginy: 24 });

    for (const n of nodes) g.setNode(n.id, { width: W, height: H });
    for (const e of edges) g.setEdge(e.source, e.target);

    Dagre.layout(g);

    // width/height explícitos: o React Flow os usa para o MiniMap e para o
    // fitView sem depender da medição assíncrona do DOM dos nós-card (senão o
    // MiniMap fica vazio e o fit corta os vizinhos no primeiro render).
    return nodes.map((n) => {
        const pos = g.node(n.id);
        return { ...n, position: { x: pos.x - W / 2, y: pos.y - H / 2 }, width: W, height: H };
    });
}

interface ApiNode {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
    grau?: number;
    relacao?: string;
}
interface ApiEdge {
    de: string;
    para: string;
    totalNFs: number;
    valorTotal?: number;
}
interface ApiProduto {
    idUnico: string;
    descricao: string;
    ncm: string;
    totalNFs: number;
    valorTotal: number;
}
export interface ApiGraph {
    cnpj: string;
    nos: ApiNode[];
    arestas: ApiEdge[];
    /** Presente quando a consulta usa includeProdutos=true (produtos da empresa-raiz). */
    produtos?: ApiProduto[];
}

/** Iniciais da razão social para o avatar do nó Empresa. */
function initials(nome: string): string {
    return nome
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase();
}

/**
 * Converte a resposta de /empresa/:cnpj/grafo em nós-card e arestas com peso,
 * mesclando com os já existentes SEM duplicar (por id = cnpj). A raiz é marcada
 * com relacao='raiz' para o nó-card destacá-la.
 */
export function mergeGraph(
    current: { nodes: GraphNode[]; edges: GraphEdge[] },
    api: ApiGraph,
    rootCnpj: string,
    /** Dados da empresa-raiz (de /empresa/:cnpj) — a API do grafo nem sempre
     *  inclui a própria raiz em `nos`, então sem isto o nó raiz fica só com o CNPJ. */
    rootMeta?: { razaoSocial?: string; uf?: string; totalNFs?: number },
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodesById = new Map(current.nodes.map((n) => [n.id, n]));
    const edgesById = new Map(current.edges.map((e) => [e.id, e]));

    const rootInfo = api.nos.find((n) => n.cnpj === rootCnpj) ?? (rootMeta ? { cnpj: rootCnpj, razaoSocial: rootMeta.razaoSocial ?? '', uf: rootMeta.uf ?? '', totalNFs: rootMeta.totalNFs ?? 0 } : undefined);
    if (!nodesById.has(rootCnpj)) {
        nodesById.set(rootCnpj, {
            id: rootCnpj,
            position: { x: 0, y: 0 },
            data: {
                tipo: 'empresa',
                label: rootInfo ? initials(rootInfo.razaoSocial) : rootCnpj.slice(0, 4),
                cnpj: rootCnpj,
                razaoSocial: rootInfo?.razaoSocial,
                uf: rootInfo?.uf,
                totalNFs: rootInfo?.totalNFs,
                relacao: 'raiz',
                detalhes: rootInfo ? { ...rootInfo } : { cnpj: rootCnpj },
            },
        });
    }

    for (const node of api.nos) {
        if (!nodesById.has(node.cnpj)) {
            nodesById.set(node.cnpj, {
                id: node.cnpj,
                position: { x: 0, y: 0 },
                data: {
                    tipo: 'empresa',
                    label: initials(node.razaoSocial) || node.cnpj.slice(0, 4),
                    cnpj: node.cnpj,
                    razaoSocial: node.razaoSocial,
                    uf: node.uf,
                    totalNFs: node.totalNFs,
                    relacao: node.relacao,
                    detalhes: { ...node },
                },
            });
        }
    }

    for (const a of api.arestas) {
        const id = `${a.de}->${a.para}`;
        if (!edgesById.has(id) && nodesById.has(a.de) && nodesById.has(a.para)) {
            edgesById.set(id, {
                id,
                source: a.de,
                target: a.para,
                type: 'weighted',
                data: { valorTotal: a.valorTotal, totalNFs: a.totalNFs },
            } as GraphEdge);
        }
    }

    // Produtos da empresa-raiz (quando includeProdutos): nó Produto + aresta.
    for (const p of api.produtos ?? []) {
        const id = `prod:${p.idUnico}`;
        if (!nodesById.has(id)) {
            nodesById.set(id, {
                id,
                position: { x: 0, y: 0 },
                data: { tipo: 'produto', label: p.descricao || p.idUnico, razaoSocial: p.descricao, uf: p.ncm, totalNFs: p.totalNFs, detalhes: { ...p } },
            });
        }
        const edgeId = `${rootCnpj}->${id}`;
        if (!edgesById.has(edgeId)) {
            edgesById.set(edgeId, { id: edgeId, source: rootCnpj, target: id, type: 'weighted', data: { valorTotal: p.valorTotal, totalNFs: p.totalNFs } } as GraphEdge);
        }
    }

    const edges = [...edgesById.values()];
    const nodes = applyLayout([...nodesById.values()], edges);
    return { nodes, edges };
}
