import { type JSX, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button.js';

/**
 * Cabeçalho padrão de página: título h2 (mantido em h2 — os e2e de Empresas e
 * Produtos usam getByRole heading level 2 para não colidir com o breadcrumb h1
 * do shell), descrição opcional e área de ações à direita. `onBack` mostra um
 * botão de voltar contextual à esquerda do título (continuidade de navegação).
 */
export function PageHeader({
    title,
    description,
    actions,
    onBack,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    onBack?: () => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                {onBack && (
                    <Button type="button" variant="ghost" size="icon" aria-label={t('comum.voltar')} onClick={onBack} className="mt-0.5 shrink-0">
                        <ArrowLeft />
                    </Button>
                )}
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
