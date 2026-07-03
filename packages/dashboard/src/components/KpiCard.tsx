import { type JSX, type ReactNode } from 'react';
import { Card, CardContent } from './ui/card.js';

/**
 * Card de indicador (KPI): ícone lucide em tile + rótulo + valor tabular.
 * Compartilhado entre Visão Geral e Impostos. Mantém data-testid="kpi-card"
 * (os e2e da Overview contam 4).
 */
export function KpiCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }): JSX.Element {
    return (
        <Card data-testid="kpi-card" className="gap-0 py-4">
            <CardContent className="flex items-center gap-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&>svg]:size-4.5">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
