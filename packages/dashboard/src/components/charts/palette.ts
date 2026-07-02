/**
 * Paleta categórica dos gráficos — lê as CSS vars --chart-1..8 definidas em
 * styles/globals.css (NOTA-ADR-8). Como são vars, respondem ao tema claro/escuro
 * automaticamente; nenhum gráfico deve hard-codar hex.
 */

/** As 8 cores categóricas, na forma `var(--chart-N)`. */
export const CHART_COLORS = Array.from({ length: 8 }, (_, i) => `var(--chart-${i + 1})`);

/** Cor categórica pelo índice (cicla nas 8). */
export function chartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length]!;
}
