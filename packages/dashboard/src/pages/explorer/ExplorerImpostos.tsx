import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaxStats } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { chartColor } from '../../components/charts/palette.js';

const brlK = (n: number): string => (n >= 1000 ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${n.toFixed(2)}`);

/** Explorador da entidade Impostos: resumo da carga tributária por tributo. */
export function ExplorerImpostos(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTaxStats();

    if (isLoading) return <LoadingSkeleton variant="card" />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;
    const totais = data?.totais;
    if (!totais) return <EmptyState mensagem={t('impostos.vazio')} />;

    const linhas = [
        { nome: 'ICMS', valor: totais.vICMS },
        { nome: 'COFINS', valor: totais.vCOFINS },
        { nome: 'IPI', valor: totais.vIPI },
        { nome: t('impostos.icmsSt'), valor: totais.vICMSST },
        { nome: 'PIS', valor: totais.vPIS },
        { nome: t('impostos.fcp'), valor: totais.vFCP },
    ].filter((l) => l.valor > 0);
    const total = linhas.reduce((s, l) => s + l.valor, 0);
    const max = Math.max(...linhas.map((l) => l.valor), 1);

    if (linhas.length === 0) return <EmptyState mensagem={t('impostos.vazio')} />;

    return (
        <div className="max-w-2xl p-4 md:p-6">
            <div className="mb-4 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{t('impostos.totalImposto')}</h3>
                <span className="font-mono text-sm font-medium tabular-nums">{brlK(total)}</span>
            </div>
            <div className="space-y-1">
                {linhas.map((l, i) => (
                    <div key={l.nome} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 py-1.5">
                        <span className="text-sm font-medium">{l.nome}</span>
                        <div className="h-2 overflow-hidden rounded bg-muted">
                            <div className="h-full rounded" style={{ width: `${(l.valor / max) * 100}%`, background: chartColor(i) }} />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{brlK(l.valor)} · {Math.round((l.valor / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
