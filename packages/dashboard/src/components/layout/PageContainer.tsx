import { type JSX, type ReactNode } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Enquadramento das páginas (ADR-17, inspirado no AdminPageContainer do upcv-pro):
 * centraliza o conteúdo (mx-auto) com um teto de largura POR TIPO de tela, para
 * que em monitores largos o conteúdo não esparrame de borda a borda. O padding
 * lateral NÃO vem daqui — vem do <main> do AppShell (p-4 md:p-6 lg:p-8), então o
 * enquadramento é uniforme entre as telas.
 *
 * Variantes de largura:
 *  - `wide` (padrão): listagens/dashboards densos → max-w-screen-xl (1280px).
 *  - `form`: telas de leitura/formulário (Config) → max-w-3xl (~768px), evita
 *    linhas de leitura longas demais.
 *  - `full`: sem teto (o próprio conteúdo controla, ex.: canvas de report).
 */
export type PageWidth = 'wide' | 'form' | 'full';

const WIDTH: Record<PageWidth, string> = {
    wide: 'max-w-screen-xl',
    form: 'max-w-3xl',
    full: '',
};

export function PageContainer({
    children,
    width = 'wide',
    className,
}: {
    children: ReactNode;
    width?: PageWidth;
    className?: string;
}): JSX.Element {
    return <div className={cn('mx-auto w-full', WIDTH[width], className)}>{children}</div>;
}
