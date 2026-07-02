import { type JSX, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Moldura padrão de gráfico: Card com título e um ResponsiveContainer de altura
 * fixa. Mantém o atributo data-testid="chart" que os e2e usam (getByTestId
 * chart → svg). Recharts é usado direto, sem o wrapper chart do shadcn (ADR-8).
 */
export function ChartCard({
    title,
    action,
    height = 260,
    children,
}: {
    title: ReactNode;
    action?: ReactNode;
    height?: number;
    /** Deve ser um único elemento de gráfico Recharts (filho do ResponsiveContainer). */
    children: JSX.Element;
}): JSX.Element {
    return (
        <Card data-testid="chart" className="gap-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{title}</CardTitle>
                {action}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {children}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
