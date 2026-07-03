/**
 * Resolve as CSS custom properties do tema (globals.css) para os seus valores
 * computados. Necessário para libs que recebem cores como strings em JS e não
 * as leem do CSS — Nivo (theme/tooltip) e Reagraph (WebGL) precisam de valores
 * concretos, ao contrário do Recharts, que aceita `var(--x)` como atributo SVG.
 *
 * Como lê do `:root` computado, responde ao tema claro/escuro — basta recomputar
 * quando o tema mudar (passar o tema como dependência do useMemo que chama isto).
 */
export interface TokenColors {
    chart: string[]; // --chart-1..8 resolvidas
    foreground: string;
    mutedForeground: string;
    border: string;
    background: string;
    card: string;
}

const read = (name: string, fallback: string): string => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
};

/** Lê os tokens de cor atuais do :root (recompute ao trocar de tema). */
export function resolveTokenColors(): TokenColors {
    return {
        chart: Array.from({ length: 8 }, (_, i) => read(`--chart-${i + 1}`, '#3b82f6')),
        foreground: read('--foreground', '#0a0a0a'),
        mutedForeground: read('--muted-foreground', '#737373'),
        border: read('--border', '#e5e5e5'),
        background: read('--background', '#ffffff'),
        card: read('--card', '#ffffff'),
    };
}
