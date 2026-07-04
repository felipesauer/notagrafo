import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Download, Home, type LucideIcon, ReceiptText, Search, Settings, Waypoints } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.js';

interface RailDef {
    to: string;
    icon: LucideIcon;
    labelKey: string;
    /** rota-raiz só casa exata (senão "/" fica sempre ativo). */
    exact?: boolean;
}

const TOP: RailDef[] = [
    { to: '/', icon: Home, labelKey: 'sidebar.inicio', exact: true },
    { to: '/explorar', icon: Search, labelKey: 'sidebar.explorar' },
    { to: '/grafo', icon: Waypoints, labelKey: 'sidebar.grafo' },
    { to: '/exportacoes', icon: Download, labelKey: 'sidebar.exportacoes' },
];
const BOTTOM: RailDef[] = [{ to: '/configuracoes', icon: Settings, labelKey: 'sidebar.configuracoes' }];

/**
 * Rail de navegação global do redesign BI (NOTA-119): faixa fina de ícones com
 * tooltip, presente em TODAS as rotas autenticadas (antes vivia inline no
 * Explorer). A troca de entidade e as views salvas NÃO estão aqui — são
 * específicas do Explorer e ficam no header dele. O TooltipProvider é montado no
 * AppShell. Mantém data-testid="app-sidebar" (dependência dos e2e).
 */
export function AppSidebar(): JSX.Element {
    const { t } = useTranslation();
    return (
        <nav
            data-testid="app-sidebar"
            aria-label={t('sidebar.grupoGeral')}
            className="hidden w-[60px] shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3 md:flex"
        >
            <Link to={'/' as string} aria-label="notagrafo"
                className="mb-3 flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm [&>svg]:size-[19px]">
                <ReceiptText />
            </Link>
            {TOP.map((r) => <RailIcon key={r.to} def={r} t={t} />)}
            <div className="flex-1" />
            {BOTTOM.map((r) => <RailIcon key={r.to} def={r} t={t} />)}
        </nav>
    );
}

function RailIcon({ def, t }: { def: RailDef; t: (k: string) => string }): JSX.Element {
    const { to, icon: Icon, labelKey, exact } = def;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    to={to as never}
                    activeOptions={{ exact: exact ?? false }}
                    aria-label={t(labelKey)}
                    className="flex size-10 items-center justify-center rounded-[10px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&.active]:bg-primary/12 [&.active]:text-primary [&>svg]:size-5"
                >
                    <Icon />
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t(labelKey)}</TooltipContent>
        </Tooltip>
    );
}
