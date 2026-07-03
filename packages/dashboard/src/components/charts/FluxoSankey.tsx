import { type JSX, useMemo } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import { useThemeStore } from '../../stores/theme.store.js';
import { resolveTokenColors } from './resolveTheme.js';
import type { FluxoAresta } from '../../api/hooks.js';

const brlCompact = (v: number): string =>
    v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${v.toFixed(0)}`;

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/** Rótulo de um nó: razão social (ou CNPJ formatado se sem nome). */
const nomeDe = (cnpj: string, nome: string): string => (nome && nome.trim() ? nome : cnpjFmt(cnpj));

interface SankeyNode {
    id: string;
    nodeColor: string;
    label: string;
}
interface SankeyLink {
    source: string;
    target: string;
    value: number;
    nfs: number;
}

/**
 * Diagrama de Sankey do fluxo de valor emitente → destinatário. Para evitar
 * ciclos (uma empresa pode emitir e receber), os nós são bipartidos por papel:
 * `de:<cnpj>` na origem e `para:<cnpj>` no destino. A espessura do link ∝ valor.
 */
export function FluxoSankey({ arestas }: { arestas: FluxoAresta[] }): JSX.Element {
    const tema = useThemeStore((s) => s.tema);

    const { data, theme } = useMemo(() => {
        const cores = resolveTokenColors();
        const nodes = new Map<string, SankeyNode>();
        const links: SankeyLink[] = [];

        for (const a of arestas) {
            const src = `de:${a.de}`;
            const tgt = `para:${a.para}`;
            if (!nodes.has(src)) nodes.set(src, { id: src, label: nomeDe(a.de, a.deNome), nodeColor: cores.chart[nodes.size % 8]! });
            if (!nodes.has(tgt)) nodes.set(tgt, { id: tgt, label: nomeDe(a.para, a.paraNome), nodeColor: cores.chart[nodes.size % 8]! });
            links.push({ source: src, target: tgt, value: Math.max(a.valorTotal, 1), nfs: a.totalNFs });
        }

        return {
            data: { nodes: [...nodes.values()], links },
            theme: {
                text: { fill: cores.foreground, fontSize: 12, fontFamily: 'inherit' },
                tooltip: { container: { background: cores.card, color: cores.foreground, fontSize: 12, borderRadius: 8, border: `1px solid ${cores.border}` } },
            },
        };
    }, [arestas, tema]);

    return (
        <ResponsiveSankey
            data={data}
            margin={{ top: 8, right: 180, bottom: 8, left: 180 }}
            align="justify"
            colors={(n: { nodeColor?: string }) => n.nodeColor ?? '#3b82f6'}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.25}
            nodeThickness={16}
            nodeSpacing={16}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.45}
            linkHoverOthersOpacity={0.12}
            linkContract={2}
            enableLinkGradient
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={10}
            theme={theme}
            label={(n: { label?: string; id: string }) => n.label ?? n.id}
            nodeTooltip={({ node }: { node: { label?: string; id: string; value: number } }) => (
                <div style={{ padding: '6px 10px', fontSize: 12 }}>
                    <strong>{node.label ?? node.id}</strong>
                    <div style={{ opacity: 0.7 }}>{brlCompact(node.value)}</div>
                </div>
            )}
            linkTooltip={({ link }: { link: { source: { label?: string }; target: { label?: string }; value: number; nfs?: number } }) => (
                <div style={{ padding: '6px 10px', fontSize: 12 }}>
                    <strong>{link.source.label}</strong> → <strong>{link.target.label}</strong>
                    <div style={{ opacity: 0.7 }}>{brlCompact(link.value)}{link.nfs !== undefined ? ` · ${link.nfs} NF-e` : ''}</div>
                </div>
            )}
        />
    );
}
