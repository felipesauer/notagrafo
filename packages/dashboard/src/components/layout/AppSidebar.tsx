import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Download, Home, type LucideIcon, PanelLeftClose, PanelLeftOpen,
    ReceiptText, Search, Settings, Waypoints,
} from 'lucide-react';
import { useUIStore } from '../../stores/ui.store.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.js';

interface RailDef {
    to: string;
    icon: LucideIcon;
    labelKey: string;
    /** rota-raiz só casa exata (senão "/" fica sempre ativo). */
    exact?: boolean;
}

/** Itens de navegação — exportados para reuso no drawer mobile (MobileNav). */
export const RAIL_TOP: RailDef[] = [
    { to: '/', icon: Home, labelKey: 'sidebar.inicio', exact: true },
    { to: '/explorar', icon: Search, labelKey: 'sidebar.explorar' },
    { to: '/grafo', icon: Waypoints, labelKey: 'sidebar.grafo' },
    { to: '/exportacoes', icon: Download, labelKey: 'sidebar.exportacoes' },
];
export const RAIL_BOTTOM: RailDef[] = [{ to: '/configuracoes', icon: Settings, labelKey: 'sidebar.configuracoes' }];

/**
 * Rail de navegação global do redesign BI (NOTA-119 / expansível NOTA-125). Faixa
 * à esquerda presente em TODAS as rotas autenticadas (desktop; no mobile vira o
 * Sheet — ver MobileNav). Colapsada mostra só ícones com tooltip; expandida
 * mostra rótulos. O estado de expansão é persistido (useUIStore). A troca de
 * entidade e as views salvas NÃO estão aqui — são do Explorer. Mantém
 * data-testid="app-sidebar" (dependência dos e2e).
 */
export function AppSidebar(): JSX.Element {
    const { t } = useTranslation();
    const expanded = useUIStore((s) => s.sidebarExpanded);
    const toggle = useUIStore((s) => s.toggleSidebar);

    return (
        <nav
            data-testid="app-sidebar"
            data-expanded={expanded}
            aria-label={t('sidebar.grupoGeral')}
            className={`hidden shrink-0 flex-col border-r bg-sidebar py-3 transition-[width] duration-200 md:flex ${expanded ? 'w-56 px-3' : 'w-[60px] items-center px-0'}`}
        >
            <Link
                to={'/' as string}
                aria-label="notagrafo"
                className={`mb-3 flex items-center gap-2 rounded-[10px] ${expanded ? 'px-1' : 'justify-center'}`}
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground [&>svg]:size-[19px]">
                    <ReceiptText />
                </span>
                {expanded && <span className="text-[15px] font-semibold tracking-tight">notagrafo</span>}
            </Link>

            <div className="flex flex-1 flex-col gap-1">
                {RAIL_TOP.map((r) => <RailIcon key={r.to} def={r} expanded={expanded} t={t} />)}
            </div>
            {RAIL_BOTTOM.map((r) => <RailIcon key={r.to} def={r} expanded={expanded} t={t} />)}

            {/* Toggle expandir/colapsar */}
            <button
                type="button"
                onClick={toggle}
                aria-label={t(expanded ? 'sidebar.colapsar' : 'sidebar.expandir')}
                aria-pressed={expanded}
                className={`mt-1 flex h-9 items-center gap-2.5 rounded-[10px] text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-5 ${expanded ? 'px-2.5' : 'w-10 justify-center'}`}
            >
                {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
                {expanded && <span className="text-[13px] font-medium">{t('sidebar.colapsar')}</span>}
            </button>
        </nav>
    );
}

function RailIcon({ def, expanded, t }: { def: RailDef; expanded: boolean; t: (k: string) => string }): JSX.Element {
    const { to, icon: Icon, labelKey, exact } = def;
    const link = (
        <Link
            to={to as never}
            activeOptions={{ exact: exact ?? false }}
            aria-label={t(labelKey)}
            className={`flex h-10 items-center rounded-[10px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&.active]:bg-primary/12 [&.active]:text-primary [&.active]:font-medium [&>svg]:size-5 ${expanded ? 'gap-2.5 px-2.5' : 'w-10 justify-center'}`}
        >
            <Icon />
            {expanded && <span className="text-[13px]">{t(labelKey)}</span>}
        </Link>
    );
    // Colapsada: tooltip com o rótulo. Expandida: o rótulo já está visível.
    if (expanded) return link;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{t(labelKey)}</TooltipContent>
        </Tooltip>
    );
}
