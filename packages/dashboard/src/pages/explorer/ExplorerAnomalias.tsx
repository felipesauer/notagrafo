import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CopyCheck, Hash, ShieldCheck } from 'lucide-react';
import { useAnomalias } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
const brl = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Tela de Anomalias (EPIC-26): consolida os achados de análise — NF-e duplicadas
 * prováveis (mesmo emitente+data+valor) e gaps de numeração (nNF faltante por
 * emitente/série). Escopo de análise: sinaliza para revisão, não corrige.
 */
export function AnomaliasContent(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useAnomalias();

    if (isLoading) return <LoadingSkeleton variant="card" />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;

    const duplicatas = data?.duplicatas ?? [];
    const gaps = data?.gaps ?? [];
    if (duplicatas.length === 0 && gaps.length === 0) {
        return (
            <EmptyState
                icon={ShieldCheck}
                titulo={t('anomalias.vazioTitulo')}
                descricao={t('anomalias.vazioDescricao')}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Duplicatas prováveis */}
            <Card className="gap-3">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-0">
                    <span className="flex size-7 items-center justify-center rounded-md bg-chart-3/15 text-chart-3 [&>svg]:size-4"><CopyCheck /></span>
                    <CardTitle className="text-base">{t('anomalias.duplicatasTitulo')} <span className="text-muted-foreground tabular-nums">({duplicatas.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    {duplicatas.length === 0 ? (
                        <p className="px-4 text-sm text-muted-foreground">{t('anomalias.semDuplicatas')}</p>
                    ) : (
                        <ul className="divide-y">
                            {duplicatas.map((d, i) => (
                                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{d.razaoSocial || cnpjFmt(d.cnpjEmitente)}</p>
                                        <p className="font-mono text-2xs text-muted-foreground tabular-nums">{d.dataEmissao} · {brl(d.valorTotal)}</p>
                                    </div>
                                    <Link
                                        to={'/explore' as string}
                                        search={{ entity: 'notas', cnpjEmitente: d.cnpjEmitente, dataEmissaoInicio: d.dataEmissao, dataEmissaoFim: d.dataEmissao } as never}
                                        className="shrink-0 rounded-full bg-chart-3/10 px-2 py-0.5 font-mono text-xs font-semibold text-chart-3 hover:underline"
                                    >
                                        {t('anomalias.nVezes', { count: d.count })}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Gaps de numeração */}
            <Card className="gap-3">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-0">
                    <span className="flex size-7 items-center justify-center rounded-md bg-chart-4/15 text-chart-4 [&>svg]:size-4"><Hash /></span>
                    <CardTitle className="text-base">{t('anomalias.gapsTitulo')} <span className="text-muted-foreground tabular-nums">({gaps.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    {gaps.length === 0 ? (
                        <p className="px-4 text-sm text-muted-foreground">{t('anomalias.semGaps')}</p>
                    ) : (
                        <ul className="divide-y">
                            {gaps.map((g, i) => (
                                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{g.razaoSocial || cnpjFmt(g.cnpjEmitente)}</p>
                                        <p className="font-mono text-2xs text-muted-foreground tabular-nums">{t('anomalias.serie')} {g.serie || '—'} · {g.from} → {g.to}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-chart-4/10 px-2 py-0.5 font-mono text-xs font-semibold text-chart-4 tabular-nums">
                                        {t('anomalias.faltando', { count: g.missing })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground lg:col-span-2">
                <AlertTriangle className="size-3.5" /> {t('anomalias.aviso')}
            </p>
        </div>
    );
}
