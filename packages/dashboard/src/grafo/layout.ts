import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

/** Tipo de nó no grafo (controla a cor/estilo). */
export type TipoNo = 'empresa' | 'notafiscal' | 'produto';

export interface DadosNo extends Record<string, unknown> {
    tipo: TipoNo;
    label: string;
    cnpj?: string;
    detalhes?: Record<string, unknown>;
}

export type NoGrafo = Node<DadosNo>;

const W = 160;
const H = 48;

/** Aplica layout hierárquico dagre aos nós, retornando-os com posições. */
export function aplicarLayout(nodes: NoGrafo[], edges: Edge[]): NoGrafo[] {
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

interface ApiNo {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
}
interface ApiAresta {
    de: string;
    para: string;
    totalNFs: number;
}
export interface ApiGrafo {
    cnpj: string;
    nos: ApiNo[];
    arestas: ApiAresta[];
}

/** Iniciais da razão social para o rótulo do nó Empresa. */
function iniciais(nome: string): string {
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
export function mesclarGrafo(
    atual: { nodes: NoGrafo[]; edges: Edge[] },
    api: ApiGrafo,
    raizCnpj: string,
): { nodes: NoGrafo[]; edges: Edge[] } {
    const nodesById = new Map(atual.nodes.map((n) => [n.id, n]));
    const edgesById = new Map(atual.edges.map((e) => [e.id, e]));

    // garante o nó raiz
    if (!nodesById.has(raizCnpj)) {
        nodesById.set(raizCnpj, { id: raizCnpj, position: { x: 0, y: 0 }, data: { tipo: 'empresa', label: raizCnpj.slice(0, 4), cnpj: raizCnpj } });
    }

    for (const no of api.nos) {
        if (!nodesById.has(no.cnpj)) {
            nodesById.set(no.cnpj, {
                id: no.cnpj,
                position: { x: 0, y: 0 },
                data: { tipo: 'empresa', label: iniciais(no.razaoSocial) || no.cnpj.slice(0, 4), cnpj: no.cnpj, detalhes: { ...no } },
            });
        }
    }

    for (const a of api.arestas) {
        const id = `${a.de}->${a.para}`;
        if (!edgesById.has(id) && nodesById.has(a.de) && nodesById.has(a.para)) {
            edgesById.set(id, { id, source: a.de, target: a.para, label: String(a.totalNFs), markerEnd: { type: 'arrowclosed' } } as Edge);
        }
    }

    const nodes = aplicarLayout([...nodesById.values()], [...edgesById.values()]);
    return { nodes, edges: [...edgesById.values()] };
}
