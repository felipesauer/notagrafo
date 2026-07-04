import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Rows2, Rows3, Rows4 } from 'lucide-react';
import { useDensityStore, type Density } from '../stores/density.store.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

const OPTS: { key: Density; icon: typeof Rows2; labelKey: string }[] = [
    { key: 'compacta', icon: Rows4, labelKey: 'explorer.densidadeCompacta' },
    { key: 'padrao', icon: Rows3, labelKey: 'explorer.densidadePadrao' },
    { key: 'espacada', icon: Rows2, labelKey: 'explorer.densidadeEspacada' },
];

/**
 * Alterna a densidade das tabelas do Explorer (redesign BI, NOTA-121): compacta /
 * padrão / espaçada. Segmented control persistido via useDensityStore; as tabelas
 * leem o estado e aplicam densityClass() no <table>.
 */
export function DensityToggle(): JSX.Element {
    const { t } = useTranslation();
    const density = useDensityStore((s) => s.density);
    const setDensity = useDensityStore((s) => s.setDensity);
    return (
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5" role="group" aria-label={t('explorer.densidade')}>
            {OPTS.map(({ key, icon: Icon, labelKey }) => (
                <Tooltip key={key}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => setDensity(key)}
                            aria-label={t(labelKey)}
                            aria-pressed={density === key}
                            className={`flex size-7 items-center justify-center rounded-md transition-colors [&>svg]:size-4 ${density === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Icon />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{t(labelKey)}</TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
