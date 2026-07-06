import { type JSX, type ReactNode } from 'react';
import { Card, CardContent } from './ui/card.js';
import { Sparkline } from './charts/Sparkline.js';
import { DeltaBadge } from './charts/DeltaBadge.js';

/**
 * Card de indicador (KPI) no estilo BI: ícone + label uppercase, valor grande
 * tabular, e opcionalmente uma linha de contexto (delta % + legenda) e um
 * sparkline de tendência ao pé. Compartilhado entre Visão Geral e Impostos.
 * Mantém data-testid="kpi-card" (os e2e da Overview contam 4).
 */
export function KpiCard({
    label,
    value,
    icon,
    delta,
    deltaInvert = false,
    hint,
    spark,
    sparkColor = 'var(--chart-1)',
}: {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    /** Variação fracionária vs período anterior (0.125 = +12,5%). */
    delta?: number;
    deltaInvert?: boolean;
    /** Texto de contexto ao lado do delta (ex.: "vs. 90d ant."). */
    hint?: ReactNode;
    /** Série para o sparkline; omitido quando não há tendência real. */
    spark?: number[];
    sparkColor?: string;
}): JSX.Element {
    return (
        <Card data-testid="kpi-card" className="h-full gap-0 overflow-hidden py-4">
            <CardContent className="flex h-full flex-col px-4">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary [&>svg]:size-4">
                        {icon}
                    </span>
                </div>
                <p className="mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums">{value}</p>
                {(delta !== undefined || hint) && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        {delta !== undefined && <DeltaBadge value={delta} invert={deltaInvert} />}
                        {hint && <span className="text-muted-foreground">{hint}</span>}
                    </div>
                )}
                {/* Sparkline ancorado ao pé; mt-auto alinha a base de todos os KPIs
                    da linha (os sem spark deixavam vazio e desalinhavam — NOTA-137). */}
                <div className="mt-auto pt-3">
                    {spark && spark.length >= 2 ? <Sparkline data={spark} color={sparkColor} /> : <div className="h-[34px]" aria-hidden />}
                </div>
            </CardContent>
        </Card>
    );
}
