import { type JSX, type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle2, FileText, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useOverview, useTopCompanies, useTaxStats } from '../../api/hooks.js';

const brlCompact = (v: number): string =>
    v >= 1e6 ? `R$ ${(v / 1e6).toFixed(1)} mi` : v >= 1e3 ? `R$ ${(v / 1e3).toFixed(0)} mil` : `R$ ${v.toFixed(0)}`;
const pct = (f: number): string => `${(f * 100).toFixed(0)}%`;
const signedPct = (f: number): string => `${f >= 0 ? '+' : ''}${(f * 100).toFixed(1)}%`;

/** Delta fracionário entre a 2ª e a 1ª metade de uma série (tendência recente). */
function trend(series: number[]): number | undefined {
    if (series.length < 4) return undefined;
    const mid = Math.floor(series.length / 2);
    const a = series.slice(0, mid).reduce((s, v) => s + v, 0);
    const b = series.slice(mid).reduce((s, v) => s + v, 0);
    if (a === 0) return undefined;
    return (b - a) / a;
}

interface Insight {
    id: string;
    icon: typeof CheckCircle2;
    tone: 'flag' | 'info' | 'ok';
    title: string;
    body: ReactNode;
}

/**
 * Coluna de Insights (redesign BI, NOTA-120). Deriva cards de recomendação de
 * DADOS REAIS já expostos pela API (overview/top-empresas/impostos) por regras
 * simples — sem IA, sem backend novo. Os hooks são cacheados pelo TanStack Query,
 * então compartilham as requisições que a Home já faz.
 */
export function InsightsPanel(): JSX.Element {
    const { t } = useTranslation();
    const overview = useOverview();
    const topCompanies = useTopCompanies();
    const taxes = useTaxStats();

    const insights = useMemo<Insight[]>(() => {
        const out: Insight[] = [];

        // 1) Variação de carga tributária (série mensal de impostos).
        const serieCarga = (taxes.data?.serie ?? []).map((p) => p.vICMS + p.vIPI + p.vPIS + p.vCOFINS);
        const dCarga = trend(serieCarga);
        if (dCarga !== undefined && Math.abs(dCarga) >= 0.02) {
            const alta = dCarga > 0;
            out.push({
                id: 'carga', icon: alta ? TrendingUp : TrendingDown, tone: alta ? 'flag' : 'info',
                title: t(alta ? 'insights.cargaTituloAlta' : 'insights.cargaTituloBaixa'),
                body: t('insights.cargaCorpo', { delta: signedPct(dCarga) }),
            });
        }

        // 2) Concentração do maior fornecedor (ranking por valor).
        const ranking = topCompanies.data?.ranking ?? [];
        const totalRank = ranking.reduce((s, e) => s + e.valorTotal, 0);
        if (ranking.length > 0 && totalRank > 0) {
            const top = ranking[0]!;
            const share = top.valorTotal / totalRank;
            if (share >= 0.25) {
                out.push({
                    id: 'concentracao', icon: AlertTriangle, tone: 'flag',
                    title: t('insights.concentracaoTitulo'),
                    body: t('insights.concentracaoCorpo', { nome: top.razaoSocial, pct: pct(share) }),
                });
            }
        }

        // 3) Última NF processada (atalho para o detalhe).
        const ultima = overview.data?.ultimasProcessadas?.[0];
        if (ultima) {
            out.push({
                id: 'ultima', icon: FileText, tone: 'info',
                title: t('insights.ultimaTitulo'),
                body: (
                    <Link to={'/nf/$chave' as string} params={{ chave: ultima.chaveAcesso } as never} className="hover:underline">
                        {t('insights.ultimaCorpo', { numero: ultima.numero, valor: brlCompact(ultima.valorTotal) })}
                    </Link>
                ),
            });
        }

        // 4) Saúde da ingestão (total + ativas).
        if (overview.data) {
            const ativas = overview.data.nfsPorStatus?.ativa ?? 0;
            out.push({
                id: 'ingestao', icon: CheckCircle2, tone: 'ok',
                title: t('insights.ingestaoTitulo'),
                body: t('insights.ingestaoCorpo', {
                    ativas: ativas.toLocaleString('pt-BR'),
                    total: overview.data.totalNFs.toLocaleString('pt-BR'),
                }),
            });
        }
        return out;
    }, [overview.data, topCompanies.data, taxes.data, t]);

    const loading = overview.isLoading || topCompanies.isLoading || taxes.isLoading;

    return (
        <aside className="flex flex-col gap-3 overflow-y-auto border-l bg-sidebar p-4" aria-label={t('insights.titulo')}>
            <h2 className="text-sm font-bold">{t('insights.titulo')}</h2>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/40" />)}
                </div>
            ) : insights.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-4"><Sparkles /></span>
                    <p className="text-xs text-muted-foreground">{t('insights.emBreve')}</p>
                </div>
            ) : (
                insights.map((it) => <InsightCard key={it.id} it={it} />)
            )}
        </aside>
    );
}

const TONE: Record<Insight['tone'], { ring: string; ico: string }> = {
    flag: { ring: 'border-chart-3/40 bg-chart-3/5', ico: 'bg-chart-3/15 text-chart-3' },
    info: { ring: 'border-border', ico: 'bg-primary/10 text-primary' },
    ok: { ring: 'border-border', ico: 'bg-status-ativa-bg text-status-ativa' },
};

function InsightCard({ it }: { it: Insight }): JSX.Element {
    const Icon = it.icon;
    const tone = TONE[it.tone];
    return (
        <div className={`flex flex-col gap-1.5 rounded-lg border p-3 ${tone.ring}`}>
            <div className="flex items-center gap-2">
                <span className={`flex size-6 items-center justify-center rounded-md ${tone.ico} [&>svg]:size-3.5`}><Icon /></span>
                <span className="text-[13px] font-semibold">{it.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{it.body}</p>
        </div>
    );
}
