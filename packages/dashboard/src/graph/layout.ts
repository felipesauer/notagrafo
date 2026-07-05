import Dagre from '@dagrejs/dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

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
/** Anexa width/height a cada nó — o React Flow os usa no MiniMap e no fitView
 *  sem depender da medição assíncrona do DOM dos nós-card. */
const withSize = (nodes: GraphNode[], pos: (id: string) => { x: number; y: number }): GraphNode[] =>
    nodes.map((n) => { const p = pos(n.id); return { ...n, position: { x: p.x - W / 2, y: p.y - H / 2 }, width: W, height: H }; });

/**
 * Layout do ego-graph: RADIAL quando há uma raiz clara (relacao === 'raiz') e o
 * resto são vizinhos diretos — a raiz fica no centro e os vizinhos distribuídos
 * num círculo ao redor (estilo grafo de rede / Power BI: sem espaço morto, sem
 * arestas longas cruzando cards). Para grafos mais profundos (depth > 1), cai no
 * dagre hierárquico LR com espaçamento generoso.
 */
export function applyLayout(nodes: GraphNode[], edges: Edge[]): GraphNode[] {
    const root = nodes.find((n) => (n.data as NodeData).relacao === 'raiz');
    const outros = nodes.filter((n) => n !== root);
    // radial quando é ego-graph: 1 raiz + vizinhos diretos (sem cadeias profundas).
    // Não há mais teto de 24 — para muitos nós usamos ANÉIS CONCÊNTRICOS por tipo
    // (empresas no anel interno; produtos/notas nos externos), evitando a coluna
    // densa que o dagre LR produzia com dezenas de nós.
    const vizinhosDiretos = outros.every((n) => edges.some((e) => (e.source === root?.id && e.target === n.id) || (e.target === root?.id && e.source === n.id)));
    const isEgo = root && outros.length >= 1 && vizinhosDiretos;

    if (isEgo && root) {
        const cx = 0, cy = 0;
        const pos = new Map<string, { x: number; y: number }>([[root.id, { x: cx, y: cy }]]);
        const handles = new Map<string, { source: Position; target: Position }>();
        const sideFor = (dx: number, dy: number): Position =>
            Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? Position.Left : Position.Right) : (dy >= 0 ? Position.Top : Position.Bottom);

        // Agrupa por tipo em anéis: empresas (interno) → produtos → notas (externo).
        const porTipo = (t: NodeType): GraphNode[] => outros.filter((n) => (n.data as NodeData).tipo === t);
        const aneis = [porTipo('empresa'), porTipo('produto'), porTipo('notafiscal')].filter((a) => a.length > 0);

        aneis.forEach((anel, idx) => {
            // raio do anel cresce com o índice e com o tamanho do MAIOR anel (evita
            // sobreposição entre anéis quando um deles tem muitos nós).
            const maxAnel = Math.max(...aneis.map((a) => a.length));
            const R = 300 + idx * Math.max(220, maxAnel * 12);
            // desloca o ângulo inicial de cada anel para os nós não alinharem radialmente
            const off = (idx * Math.PI) / aneis.length;
            anel.forEach((n, i) => {
                const ang = (i / anel.length) * Math.PI * 2 - Math.PI / 2 + off + 0.0001;
                const dx = Math.cos(ang), dy = Math.sin(ang);
                pos.set(n.id, { x: cx + dx * R, y: cy + dy * R });
                const side = sideFor(dx, dy);
                handles.set(n.id, { source: side, target: side });
            });
        });

        return nodes.map((n) => {
            const p = pos.get(n.id) ?? { x: 0, y: 0 };
            const h = handles.get(n.id);
            return {
                ...n,
                position: { x: p.x - W / 2, y: p.y - H / 2 },
                width: W, height: H,
                ...(h ? { sourcePosition: h.source, targetPosition: h.target } : {}),
            };
        });
    }

    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 240, edgesep: 40, marginx: 40, marginy: 40, ranker: 'network-simplex' });
    for (const n of nodes) g.setNode(n.id, { width: W, height: H });
    for (const e of edges) g.setEdge(e.source, e.target);
    Dagre.layout(g);
    return withSize(nodes, (id) => g.node(id));
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
interface ApiNota {
    chaveAcesso: string;
    numero: string;
    valorTotal: number;
    status: string;
    cnpjEmitente: string;
    cnpjDestinatario: string;
}
export interface ApiGraph {
    cnpj: string;
    nos: ApiNode[];
    arestas: ApiEdge[];
    /** Presente quando a consulta usa includeProdutos=true (produtos da empresa-raiz). */
    produtos?: ApiProduto[];
    /** Presente quando a consulta usa includeNotas=true (NF-e trocadas com vizinhos). */
    notas?: ApiNota[];
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

    // NF-e trocadas (quando includeNotas): nó NotaFiscal entre emitente→NF→destinatário.
    // Só cria a nota se pelo menos uma das pontas já é um nó de empresa no grafo,
    // ligando a nota às empresas que existem (evita nós órfãos soltos).
    for (const nf of api.notas ?? []) {
        const emitOk = nodesById.has(nf.cnpjEmitente);
        const destOk = nodesById.has(nf.cnpjDestinatario);
        if (!emitOk && !destOk) continue;
        const id = `nf:${nf.chaveAcesso}`;
        if (!nodesById.has(id)) {
            nodesById.set(id, {
                id,
                position: { x: 0, y: 0 },
                data: {
                    tipo: 'notafiscal',
                    label: `NF ${nf.numero}`,
                    totalNFs: 1,
                    detalhes: { ...nf },
                },
            });
        }
        if (emitOk) {
            const e1 = `${nf.cnpjEmitente}->${id}`;
            if (!edgesById.has(e1)) edgesById.set(e1, { id: e1, source: nf.cnpjEmitente, target: id, type: 'weighted', data: { valorTotal: nf.valorTotal, totalNFs: 1 } } as GraphEdge);
        }
        if (destOk) {
            const e2 = `${id}->${nf.cnpjDestinatario}`;
            if (!edgesById.has(e2)) edgesById.set(e2, { id: e2, source: id, target: nf.cnpjDestinatario, type: 'weighted', data: { valorTotal: nf.valorTotal, totalNFs: 1 } } as GraphEdge);
        }
    }

    const edges = [...edgesById.values()];
    const nodes = applyLayout([...nodesById.values()], edges);
    return { nodes, edges };
}
