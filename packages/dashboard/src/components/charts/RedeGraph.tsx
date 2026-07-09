import { type JSX, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MonitorX } from 'lucide-react';
import { GraphCanvas, type GraphCanvasRef, type GraphNode, type GraphEdge, useSelection, lightTheme, darkTheme } from 'reagraph';
import { useThemeStore } from '../../stores/theme.store.js';
import { resolveTokenColorsRGB } from './resolveTheme.js';
import type { RedeNo, RedeAresta } from '../../api/hooks.js';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/**
 * Testa se o navegador consegue criar um contexto WebGL. O grafo em força usa
 * three.js (WebGL); se estiver desabilitado (GPU bloqueada, sandbox, driver
 * ausente), o GraphCanvas monta um canvas que fica preto e silencioso. Detectar
 * antes permite mostrar um aviso claro em vez de uma tela em branco (NOTA-196).
 */
function isWebGLAvailable(): boolean {
    if (typeof document === 'undefined') return true; // SSR/testes: não bloquear
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl2') || canvas.getContext('webgl'))
        );
    } catch {
        return false;
    }
}

/**
 * Rede comercial completa em WebGL (Reagraph): layout de força, coloração por UF
 * ou por comunidade detectada (EPIC-28), nós dimensionados pela centralidade de
 * grau (ou atividade) e busca de caminho — clicar em duas empresas destaca o
 * caminho comercial entre elas. Tema claro/escuro sincronizado.
 *
 * `centrality` (cnpj→grau) dimensiona os nós quando presente; `communityOf`
 * (cnpj→id da comunidade) permite colorir por cluster quando colorBy='community'.
 */
export function RedeGraph({
    nos,
    arestas,
    centrality,
    communityOf,
    colorBy = 'uf',
}: {
    nos: RedeNo[];
    arestas: RedeAresta[];
    centrality?: Map<string, number>;
    communityOf?: Map<string, string>;
    colorBy?: 'uf' | 'community';
}): JSX.Element {
    const { t } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const ref = useRef<GraphCanvasRef | null>(null);
    const webglOk = useMemo(() => isWebGLAvailable(), []);

    const { nodes, edges, theme, legenda } = useMemo(() => {
        const cores = resolveTokenColorsRGB();
        const byCommunity = colorBy === 'community' && !!communityOf;

        // Chave de agrupamento por nó: UF ou id da comunidade (fallback '—').
        const groupOf = (cnpj: string, uf: string): string =>
            byCommunity ? communityOf!.get(cnpj) ?? '—' : uf || '—';

        const grupos = [...new Set(nos.map((n) => groupOf(n.cnpj, n.uf)))].sort();
        const corDoGrupo = new Map(grupos.map((g, i) => [g, cores.chart[i % 8]!]));
        // Legenda: nº de empresas por grupo, para o usuário ler a cor (não confiar só nela).
        const cont = new Map<string, number>();
        for (const n of nos) {
            const g = groupOf(n.cnpj, n.uf);
            cont.set(g, (cont.get(g) ?? 0) + 1);
        }
        const legenda = grupos
            .map((g) => ({ grupo: g, cor: corDoGrupo.get(g)!, total: cont.get(g) ?? 0 }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        const nodes: GraphNode[] = nos.map((n) => {
            // Tamanho por centralidade (grau) quando disponível; senão atividade.
            const sizeVal = centrality?.get(n.cnpj) ?? n.totalNFs;
            const group = groupOf(n.cnpj, n.uf);
            return {
                id: n.cnpj,
                label: n.razaoSocial || cnpjFmt(n.cnpj),
                size: sizeVal,
                fill: corDoGrupo.get(group),
                // clusterAttribute e sizeAttribute leem de node.data[attr] no Reagraph.
                data: { group, sizeVal, cnpj: n.cnpj },
            };
        });

        const edges: GraphEdge[] = arestas.map((a, i) => ({
            id: `e${i}`,
            source: a.de,
            target: a.para,
            size: Math.min(6, Math.max(1, Math.log10(Math.max(a.valorTotal, 10)))),
            data: { valorTotal: a.valorTotal, totalNFs: a.totalNFs },
        }));

        const base = tema === 'escuro' ? darkTheme : lightTheme;
        const theme = {
            ...base,
            canvas: { ...base.canvas, background: cores.card },
            node: {
                ...base.node,
                label: { ...base.node.label, color: cores.foreground, stroke: cores.card, activeColor: cores.foreground },
            },
            edge: {
                ...base.edge,
                fill: cores.mutedForeground,
                activeFill: cores.foreground,
                label: { ...base.edge.label, color: cores.mutedForeground, stroke: cores.card, activeColor: cores.foreground },
            },
            cluster: base.cluster
                ? { ...base.cluster, stroke: cores.border, label: { ...base.cluster.label, color: cores.mutedForeground, stroke: cores.card } }
                : base.cluster,
        };

        return { nodes, edges, theme, legenda };
    }, [nos, arestas, tema, centrality, communityOf, colorBy]);

    const { selections, actives, onNodeClick, onCanvasClick, clearSelections } = useSelection({
        ref,
        nodes,
        pathSelectionType: 'all', // clicar em 2 nós destaca o caminho entre eles
    });

    // Enquadra os nós na câmera após o layout de força assentar. Sem isto,
    // dependendo da composição do grafo (nós quase isolados, componentes
    // desconexos), a câmera inicial podia ficar fora da área dos nós — o canvas
    // parecia "vazio" mesmo com o grafo renderizado (NOTA-196). O delay dá tempo
    // do forceDirected2d posicionar antes de centralizar.
    useEffect(() => {
        if (nodes.length === 0) return;
        const id = setTimeout(() => ref.current?.fitNodesInView(), 600);
        return () => clearTimeout(id);
    }, [nodes]);

    // WebGL indisponível (GPU bloqueada/sandbox/driver ausente): o GraphCanvas
    // ficaria um canvas preto silencioso. Mostra um aviso claro (NOTA-196).
    if (!webglOk) {
        return (
            <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
                <MonitorX className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">{t('rede.semWebglTitulo')}</p>
                <p className="max-w-sm text-xs text-muted-foreground">{t('rede.semWebglDescricao')}</p>
            </div>
        );
    }

    return (
        <div className="relative size-full">
            <GraphCanvas
                ref={ref}
                nodes={nodes}
                edges={edges}
                theme={theme}
                layoutType="forceDirected2d"
                layoutOverrides={{ linkDistance: 180, nodeStrength: -650, clusterStrength: 0.35 }}
                sizingType="attribute"
                sizingAttribute="sizeVal"
                minNodeSize={6}
                maxNodeSize={18}
                clusterAttribute="group"
                labelType="all"
                edgeArrowPosition="end"
                draggable
                animated
                selections={selections}
                actives={actives}
                onNodeClick={onNodeClick}
                onCanvasClick={onCanvasClick}
            />
            {selections.length > 0 ? (
                <button
                    type="button"
                    onClick={() => clearSelections()}
                    className="absolute right-3 top-3 rounded-md border bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur hover:bg-accent"
                >
                    {t('rede.limparSelecao')}
                </button>
            ) : (
                <div className="pointer-events-none absolute left-3 top-3 rounded-md border bg-background/80 px-2.5 py-1 text-2xs text-muted-foreground shadow-sm backdrop-blur">
                    {t('rede.dicaInteracao')}
                </div>
            )}

            {/* Legenda de cor por UF/comunidade (anti-hairball: nunca cor sozinha — parear com rótulo). */}
            {legenda.length > 0 && (
                <div className="pointer-events-none absolute bottom-3 left-3 max-w-[220px] rounded-md border bg-background/85 p-2 text-2xs shadow-sm backdrop-blur">
                    <p className="mb-1 font-semibold text-muted-foreground">
                        {colorBy === 'community' ? t('rede.legendaComunidade') : t('rede.legendaUf')}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {legenda.map((l) => (
                            <li key={l.grupo} className="flex items-center gap-1.5">
                                <span className="size-2 shrink-0 rounded-[3px]" style={{ background: l.cor }} />
                                <span className="truncate font-medium">
                                    {colorBy === 'community' ? cnpjFmt(l.grupo) : l.grupo}
                                </span>
                                <span className="ml-auto tabular-nums text-muted-foreground">{l.total}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
