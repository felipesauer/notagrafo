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

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const g = (u: number): number => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const hex2 = (n: number): string => Math.round(clamp01(n) * 255).toString(16).padStart(2, '0');

/**
 * Converte `oklch(L C H)` para hex `#rrggbb`. THREE.Color (Reagraph/WebGL) não
 * entende oklch — e nem canvas 2D nem getComputedStyle o normalizam para rgb
 * neste Chromium (preservam oklch). Fazemos a conversão OKLab→sRGB à mão.
 * L aceita 0..1 ou porcentagem; ignora alpha. Formatos não-oklch passam direto.
 */
export function toRgb(color: string): string {
    const m = /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i.exec(color);
    if (!m) return color;
    const L = m[1]!.endsWith('%') ? parseFloat(m[1]!) / 100 : parseFloat(m[1]!);
    const C = parseFloat(m[2]!);
    const H = (parseFloat(m[3]!) * Math.PI) / 180;
    const a = C * Math.cos(H);
    const b = C * Math.sin(H);
    // OKLab → LMS (cúbico) → linear sRGB
    const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
    const gr = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
    const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
    return `#${hex2(g(r))}${hex2(g(gr))}${hex2(g(bl))}`;
}

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

/** Como resolveTokenColors, mas com todas as cores normalizadas para rgb() (WebGL). */
export function resolveTokenColorsRGB(): TokenColors {
    const c = resolveTokenColors();
    return {
        chart: c.chart.map(toRgb),
        foreground: toRgb(c.foreground),
        mutedForeground: toRgb(c.mutedForeground),
        border: toRgb(c.border),
        background: toRgb(c.background),
        card: toRgb(c.card),
    };
}
