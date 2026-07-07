import { type JSX, type ReactNode, lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCompareArrows, Network as NetworkIcon } from 'lucide-react';
import { useFluxo, useRede, useCentrality, useCommunities } from '../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { FadeIn } from '../components/Motion.js';
import { FluxoSankey } from '../components/charts/FluxoSankey.js';
import { Card, CardContent, CardHeader } from '../components/ui/card.js';
import { Slider } from '../components/ui/slider.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { cn } from '../lib/utils.js';

// Reagraph traz o three.js (WebGL, ~1,5 MB): carrega só quando a aba de rede
// completa é aberta, mantendo a aba de fluxo (Nivo) leve.
const RedeGraph = lazy(() => import('../components/charts/RedeGraph.js').then((m) => ({ default: m.RedeGraph })));

type Aba = 'fluxo' | 'rede';

/** Página de análise de rede: aba de fluxo (Sankey/Nivo) + aba de rede completa (Reagraph, NOTA-108). */
/** Conteúdo da Rede (abas Fluxo/Rede completa) sem PageHeader — reutilizado na
 *  página standalone e no explorador (onde o header vem da casca). */
export function NetworkContent(): JSX.Element {
    const { t } = useTranslation();
    const [aba, setAba] = useState<Aba>('fluxo');

    return (
        <div>
            <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1" role="tablist">
                <TabButton active={aba === 'fluxo'} onClick={() => setAba('fluxo')} icon={<GitCompareArrows className="size-4" />}>
                    {t('rede.abaFluxo')}
                </TabButton>
                <TabButton active={aba === 'rede'} onClick={() => setAba('rede')} icon={<NetworkIcon className="size-4" />}>
                    {t('rede.abaRede')}
                </TabButton>
            </div>

            {aba === 'fluxo' ? <FluxoTab /> : <RedeTab />}
        </div>
    );
}

export function NetworkPage(): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('rede.titulo')} description={t('rede.subtitulo')} />
            <NetworkContent />
        </div>
    );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: JSX.Element; children: ReactNode }): JSX.Element {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {icon}
            {children}
        </button>
    );
}

/** Aba de fluxo de valor entre empresas (Sankey). */
function FluxoTab(): JSX.Element {
    const { t } = useTranslation();
    const [limite, setLimite] = useState(30);
    const query = useFluxo(limite);
    const arestas = query.data?.arestas ?? [];

    return (
        <FadeIn>
            <Card className="gap-4">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-base leading-none font-semibold">{t('rede.fluxoTitulo')}</h3>
                        <p className="max-w-xl text-xs text-muted-foreground">{t('rede.fluxoAjuda')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {t('rede.topPares')}: <span className="font-medium tabular-nums text-foreground">{limite}</span>
                        </span>
                        <Slider
                            className="w-40"
                            min={5}
                            max={60}
                            step={5}
                            value={[limite]}
                            onValueChange={(v) => setLimite(v[0] ?? 30)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {query.isLoading ? (
                        <LoadingSkeleton variant="card" />
                    ) : query.isError ? (
                        <InlineError onRetry={() => void query.refetch()} />
                    ) : arestas.length === 0 ? (
                        <EmptyState icon={GitCompareArrows} titulo={t('rede.vazioTitulo')} descricao={t('rede.vazioFluxoDescricao')} />
                    ) : (
                        <div className="h-[560px] w-full">
                            <FluxoSankey arestas={arestas} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </FadeIn>
    );
}

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/** Aba da rede completa: grafo WebGL com centralidade, comunidades, recorte temporal (EPIC-28). */
function RedeTab(): JSX.Element {
    const { t } = useTranslation();
    const [limite, setLimite] = useState(150);
    const [colorBy, setColorBy] = useState<'uf' | 'community'>('uf');
    // Recorte temporal opcional (mês). Vazio = rede inteira.
    const [mes, setMes] = useState<string>('');
    const period = mes ? { dataInicio: `${mes}-01`, dataFim: `${mes}-31` } : undefined;

    const query = useRede(limite, period);
    const centralityQuery = useCentrality(50);
    const communitiesQuery = useCommunities();

    const nos = query.data?.nos ?? [];
    const arestas = query.data?.arestas ?? [];
    const ranking = centralityQuery.data?.ranking ?? [];
    const communities = communitiesQuery.data?.communities ?? [];

    // Mapas para o grafo: cnpj→grau (tamanho) e cnpj→id da comunidade (cor).
    const centralityMap = useMemo(() => new Map(ranking.map((r) => [r.cnpj, r.degree])), [ranking]);
    const communityOf = useMemo(() => {
        const m = new Map<string, string>();
        for (const c of communities) for (const cnpj of c.members) m.set(cnpj, c.id);
        return m;
    }, [communities]);

    return (
        <FadeIn>
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <Card className="gap-4">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h3 className="text-base leading-none font-semibold">{t('rede.redeTitulo')}</h3>
                            <p className="max-w-xl text-xs text-muted-foreground">{t('rede.redeAjuda')}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Coloração: UF ou comunidade detectada */}
                            <NativeSelect
                                wrapperClassName="w-40"
                                value={colorBy}
                                onChange={(e) => setColorBy(e.target.value as 'uf' | 'community')}
                                aria-label={t('rede.colorirPor')}
                            >
                                <option value="uf">{t('rede.colorirUf')}</option>
                                <option value="community">{t('rede.colorirComunidade')}</option>
                            </NativeSelect>
                            {/* Recorte temporal (mês) — evolução da rede */}
                            <input
                                type="month"
                                className="h-9 rounded-md border bg-background px-2 text-xs"
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                aria-label={t('rede.periodo')}
                            />
                            <Slider className="w-32" min={20} max={300} step={10} value={[limite]} onValueChange={(v) => setLimite(v[0] ?? 150)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {query.isLoading ? (
                            <LoadingSkeleton variant="card" />
                        ) : query.isError ? (
                            <InlineError onRetry={() => void query.refetch()} />
                        ) : nos.length === 0 ? (
                            <EmptyState icon={NetworkIcon} titulo={t('rede.vazioTitulo')} descricao={t('rede.vazioRedeDescricao')} />
                        ) : (
                            <div className="relative h-[560px] w-full overflow-hidden rounded-lg border bg-muted/20">
                                <Suspense fallback={<LoadingSkeleton variant="card" />}>
                                    <RedeGraph
                                        nos={nos}
                                        arestas={arestas}
                                        centrality={centralityMap}
                                        communityOf={communityOf}
                                        colorBy={colorBy}
                                    />
                                </Suspense>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ranking de empresas-hub por centralidade (EPIC-28) */}
                <Card className="gap-3">
                    <CardHeader className="pb-0">
                        <h3 className="text-base leading-none font-semibold">{t('rede.hubsTitulo')}</h3>
                        <p className="text-xs text-muted-foreground">{t('rede.hubsAjuda')}</p>
                    </CardHeader>
                    <CardContent className="px-0">
                        {centralityQuery.isLoading ? (
                            <div className="px-4"><LoadingSkeleton variant="card" /></div>
                        ) : ranking.length === 0 ? (
                            <p className="px-4 text-sm text-muted-foreground">{t('rede.vazioRedeDescricao')}</p>
                        ) : (
                            <ol className="divide-y">
                                {ranking.slice(0, 12).map((r, i) => (
                                    <li key={r.cnpj} className="flex items-center gap-3 px-4 py-2 text-sm">
                                        <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{r.razaoSocial || cnpjFmt(r.cnpj)}</p>
                                            <p className="text-2xs text-muted-foreground">{r.uf || '—'}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary tabular-nums">
                                            {t('rede.parceiros', { count: r.degree })}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                        {communities.length > 0 && (
                            <p className="border-t px-4 pt-2 text-2xs text-muted-foreground">
                                {t('rede.comunidadesResumo', { count: communities.length })}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </FadeIn>
    );
}
