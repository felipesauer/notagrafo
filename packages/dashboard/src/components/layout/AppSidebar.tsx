import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Activity, Download, Home, Landmark, type LucideIcon, Network, PanelLeftClose, PanelLeftOpen,
    ReceiptText, Search, Settings, Waypoints,
} from 'lucide-react';
import { useUIStore } from '../../stores/ui.store.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.js';

interface RailDef {
    to: string;
    search?: Record<string, string>;
    icon: LucideIcon;
    labelKey: string;
    /** rota-raiz só casa exata (senão "/" fica sempre ativo). */
    exact?: boolean;
}
interface RailGroup {
    labelKey: string;
    items: RailDef[];
}

/**
 * Grupos de navegação — exportados para reuso no drawer mobile (MobileNav). As
 * lentes de Análise (Rede/Impostos/Eventos) são recortes do Explorer, então
 * apontam para /explorar?entity=… (a mesma casca, trocando a entidade).
 */
export const RAIL_GROUPS: RailGroup[] = [
    {
        labelKey: 'sidebar.grupoGeral',
        items: [
            { to: '/', icon: Home, labelKey: 'sidebar.inicio', exact: true },
            { to: '/explorar', icon: Search, labelKey: 'sidebar.explorar' },
        ],
    },
    {
        labelKey: 'sidebar.grupoAnalise',
        items: [
            { to: '/grafo', icon: Waypoints, labelKey: 'sidebar.grafo' },
            { to: '/explorar', search: { entity: 'rede' }, icon: Network, labelKey: 'sidebar.rede' },
            { to: '/explorar', search: { entity: 'impostos' }, icon: Landmark, labelKey: 'sidebar.impostos' },
            { to: '/explorar', search: { entity: 'eventos' }, icon: Activity, labelKey: 'sidebar.eventos' },
        ],
    },
    {
        labelKey: 'sidebar.grupoSistema',
        items: [
            { to: '/exportacoes', icon: Download, labelKey: 'sidebar.exportacoes' },
            { to: '/configuracoes', icon: Settings, labelKey: 'sidebar.configuracoes' },
        ],
    },
];

/**
 * Rail de navegação global do redesign BI (NOTA-119 / expansível+agrupado NOTA-125).
 * Faixa à esquerda em TODAS as rotas autenticadas (desktop; no mobile vira o Sheet).
 * Colapsada: só ícones com tooltip. Expandida: rótulos + títulos de grupo. O toggle
 * de expansão fica no topo (ao lado da marca); estado persistido (useUIStore).
 * Mantém data-testid="app-sidebar" (dependência dos e2e).
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
            className={`hidden shrink-0 flex-col gap-1 border-r bg-sidebar py-3 transition-[width] duration-200 md:flex ${expanded ? 'w-60 px-3' : 'w-[64px] items-center px-2'}`}
        >
            {/* Marca + toggle no topo */}
            <div className={`mb-2 flex items-center ${expanded ? 'justify-between' : 'flex-col gap-1'}`}>
                <Link to={'/' as string} aria-label="notagrafo" className="flex items-center gap-2 rounded-[10px]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground [&>svg]:size-[19px]">
                        <ReceiptText />
                    </span>
                    {expanded && <span className="text-[15px] font-semibold tracking-tight">notagrafo</span>}
                </Link>
                <ToggleBtn expanded={expanded} onClick={toggle} t={t} />
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
                {RAIL_GROUPS.map((g) => (
                    <div key={g.labelKey} className="flex flex-col gap-0.5">
                        {expanded ? (
                            <p className="px-2.5 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                                {t(g.labelKey)}
                            </p>
                        ) : (
                            <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border" aria-hidden />
                        )}
                        {g.items.map((r) => <RailIcon key={r.to + (r.search?.entity ?? '')} def={r} expanded={expanded} t={t} />)}
                    </div>
                ))}
            </div>
        </nav>
    );
}

function ToggleBtn({ expanded, onClick, t }: { expanded: boolean; onClick: () => void; t: (k: string) => string }): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={t(expanded ? 'sidebar.colapsar' : 'sidebar.expandir')}
            aria-pressed={expanded}
            className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-[18px]"
        >
            {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </button>
    );
}

function RailIcon({ def, expanded, t }: { def: RailDef; expanded: boolean; t: (k: string) => string }): JSX.Element {
    const { to, search, icon: Icon, labelKey, exact } = def;
    const link = (
        <Link
            to={to as never}
            search={(search ?? undefined) as never}
            activeOptions={{ exact: exact ?? false }}
            aria-label={t(labelKey)}
            className={`flex h-9 items-center rounded-[10px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&.active]:bg-primary/12 [&.active]:font-medium [&.active]:text-primary [&>svg]:size-[18px] ${expanded ? 'gap-2.5 px-2.5' : 'w-10 justify-center'}`}
        >
            <Icon />
            {expanded && <span className="text-[13px]">{t(labelKey)}</span>}
        </Link>
    );
    if (expanded) return link;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{t(labelKey)}</TooltipContent>
        </Tooltip>
    );
}
