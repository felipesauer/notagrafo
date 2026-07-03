import { type JSX, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card.js';
import { ChartContainer, type ChartConfig } from '../ui/chart.js';

/**
 * Moldura padrão de gráfico: Card + título + ChartContainer do shadcn (NOTA-ADR-12).
 * O ChartContainer envolve o ResponsiveContainer e injeta as CSS vars da paleta
 * (var(--color-KEY)) a partir do `config`, além de estilizar eixos/grid/legenda.
 * Mantém data-testid="chart" (e2e) e o <h3> de seção.
 *
 * `config` é opcional para retrocompat com as páginas ainda não migradas ao
 * padrão de ChartConfig (elas passam cores via CSS var direto no mark). `height`
 * (px, legado) vai por `style` (classe Tailwind dinâmica não é detectada pelo
 * scanner v4); prefira passar altura via `className` estático.
 */
export function ChartCard({
    title,
    action,
    config,
    height = 260,
    className,
    children,
}: {
    title: ReactNode;
    action?: ReactNode;
    config?: ChartConfig;
    height?: number;
    className?: string;
    children: JSX.Element;
}): JSX.Element {
    return (
        <Card data-testid="chart" className="gap-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-base leading-none font-semibold">{title}</h3>
                {action}
            </CardHeader>
            <CardContent>
                <ChartContainer config={config ?? {}} className={className ?? 'w-full'} style={{ height }}>
                    {children}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
