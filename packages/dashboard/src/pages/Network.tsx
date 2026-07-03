import { type JSX, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCompareArrows, Network as NetworkIcon } from 'lucide-react';
import { useFluxo } from '../api/hooks.js';
import { LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { FadeIn } from '../components/Motion.js';
import { FluxoSankey } from '../components/charts/FluxoSankey.js';
import { Card, CardContent, CardHeader } from '../components/ui/card.js';
import { Slider } from '../components/ui/slider.js';
import { cn } from '../lib/utils.js';

type Aba = 'fluxo' | 'rede';

/** Página de análise de rede: aba de fluxo (Sankey/Nivo) + aba de rede completa (Reagraph, NOTA-108). */
export function NetworkPage(): JSX.Element {
    const { t } = useTranslation();
    const [aba, setAba] = useState<Aba>('fluxo');

    return (
        <div>
            <PageHeader title={t('rede.titulo')} description={t('rede.subtitulo')} />

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
                        <EmptyState mensagem={t('rede.vazio')} />
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

/** Aba da rede completa — implementada na NOTA-108 (Reagraph/WebGL). */
function RedeTab(): JSX.Element {
    const { t } = useTranslation();
    return (
        <Card>
            <CardContent className="py-16">
                <EmptyState mensagem={t('rede.abaRede')} />
            </CardContent>
        </Card>
    );
}
