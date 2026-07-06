import { type JSX, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphCanvas, type GraphCanvasRef, type GraphNode, type GraphEdge, useSelection, lightTheme, darkTheme } from 'reagraph';
import { useThemeStore } from '../../stores/theme.store.js';
import { resolveTokenColorsRGB } from './resolveTheme.js';
import type { RedeNo, RedeAresta } from '../../api/hooks.js';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/**
 * Rede comercial completa em WebGL (Reagraph): layout de força, comunidades por
 * UF (clusterAttribute) coloridas com os tokens --chart-*, nós dimensionados
 * pela atividade (totalNFs) e busca de caminho — clicar em duas empresas
 * destaca o caminho comercial entre elas. Tema claro/escuro sincronizado.
 */
export function RedeGraph({ nos, arestas }: { nos: RedeNo[]; arestas: RedeAresta[] }): JSX.Element {
    const { t } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const ref = useRef<GraphCanvasRef | null>(null);

    const { nodes, edges, theme, legenda } = useMemo(() => {
        const cores = resolveTokenColorsRGB();
        // Uma cor por UF (comunidade), ciclando na paleta de tokens.
        const ufs = [...new Set(nos.map((n) => n.uf || '—'))].sort();
        const corDaUf = new Map(ufs.map((uf, i) => [uf, cores.chart[i % 8]!]));
        // Legenda: nº de empresas por UF, para o usuário ler a cor (não confiar só nela).
        const contUf = new Map<string, number>();
        for (const n of nos) contUf.set(n.uf || '—', (contUf.get(n.uf || '—') ?? 0) + 1);
        const legenda = ufs
            .map((uf) => ({ uf, cor: corDaUf.get(uf)!, total: contUf.get(uf) ?? 0 }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        const nodes: GraphNode[] = nos.map((n) => ({
            id: n.cnpj,
            label: n.razaoSocial || cnpjFmt(n.cnpj),
            size: n.totalNFs,
            fill: corDaUf.get(n.uf || '—'),
            // clusterAttribute e sizeAttribute leem de node.data[attr] no Reagraph.
            data: { uf: n.uf || '—', totalNFs: n.totalNFs, cnpj: n.cnpj },
        }));

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
    }, [nos, arestas, tema]);

    const { selections, actives, onNodeClick, onCanvasClick, clearSelections } = useSelection({
        ref,
        nodes,
        pathSelectionType: 'all', // clicar em 2 nós destaca o caminho entre eles
    });

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
                sizingAttribute="totalNFs"
                minNodeSize={6}
                maxNodeSize={18}
                clusterAttribute="uf"
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
                <div className="pointer-events-none absolute left-3 top-3 rounded-md border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                    {t('rede.dicaInteracao')}
                </div>
            )}

            {/* Legenda de cor por UF (anti-hairball: nunca cor sozinha — parear com rótulo). */}
            {legenda.length > 0 && (
                <div className="pointer-events-none absolute bottom-3 left-3 max-w-[220px] rounded-md border bg-background/85 p-2 text-[11px] shadow-sm backdrop-blur">
                    <p className="mb-1 font-semibold text-muted-foreground">{t('rede.legendaUf')}</p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {legenda.map((l) => (
                            <li key={l.uf} className="flex items-center gap-1.5">
                                <span className="size-2 shrink-0 rounded-[3px]" style={{ background: l.cor }} />
                                <span className="font-medium">{l.uf}</span>
                                <span className="ml-auto tabular-nums text-muted-foreground">{l.total}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
