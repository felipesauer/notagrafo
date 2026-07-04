import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

/**
 * Coluna de Insights (redesign BI, NOTA-119). Nesta fase é só a moldura — os
 * cards de recomendação/atividade derivados de dados reais chegam na Fase 2
 * (NOTA-120). Fica à direita, colapsável pelo toggle na Topbar.
 */
export function InsightsPanel(): JSX.Element {
    const { t } = useTranslation();
    return (
        <aside className="flex flex-col gap-4 overflow-y-auto border-l bg-sidebar p-4" aria-label={t('sidebar.insights')}>
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">{t('sidebar.insights')}</h2>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-4">
                    <Sparkles />
                </span>
                <p className="text-xs text-muted-foreground">{t('insights.emBreve')}</p>
            </div>
        </aside>
    );
}
