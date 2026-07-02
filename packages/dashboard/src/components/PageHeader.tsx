import { type JSX, type ReactNode } from 'react';

/**
 * Cabeçalho padrão de página: título h2 (mantido em h2 — os e2e de Empresas e
 * Produtos usam getByRole heading level 2 para não colidir com o breadcrumb h1
 * do shell), descrição opcional e área de ações à direita.
 */
export function PageHeader({
    title,
    description,
    actions,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}): JSX.Element {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
