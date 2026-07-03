import { type JSX, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

/**
 * Mini gráfico de tendência (sparkline): AreaChart sem eixos/grid/tooltip, com
 * gradiente de área (defs/linearGradient). Usado nos KPI cards. `data` é a série
 * de valores; `color` é uma CSS var (ex.: 'var(--chart-2)').
 */
export function Sparkline({
    data,
    color = 'var(--chart-1)',
    height = 34,
}: {
    data: number[];
    color?: string;
    height?: number;
}): JSX.Element | null {
    const id = useId().replace(/:/g, '');
    if (!data || data.length < 2) return null;
    const series = data.map((v, i) => ({ i, v }));
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    dataKey="v"
                    type="monotone"
                    stroke={color}
                    strokeWidth={1.75}
                    fill={`url(#spark-${id})`}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
