import { type JSX } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Activity, Building2, Download, FileText, Home, Landmark, type LucideIcon, Network, Package,
    PanelLeftClose, PanelLeftOpen, Settings, Waypoints,
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
            { to: '/grafo', icon: Waypoints, labelKey: 'sidebar.grafo' },
        ],
    },
    {
        // ANÁLISE é o hub do Explorer: cada entidade é um item direto no rail,
        // navegando para /explorar?entity=… (ADR NOTA-ADR-14).
        labelKey: 'sidebar.grupoAnalise',
        items: [
            { to: '/explorar', search: { entity: 'notas' }, icon: FileText, labelKey: 'sidebar.nfs' },
            { to: '/explorar', search: { entity: 'empresas' }, icon: Building2, labelKey: 'sidebar.empresas' },
            { to: '/explorar', search: { entity: 'produtos' }, icon: Package, labelKey: 'sidebar.produtos' },
            { to: '/explorar', search: { entity: 'impostos' }, icon: Landmark, labelKey: 'sidebar.impostos' },
            { to: '/explorar', search: { entity: 'rede' }, icon: Network, labelKey: 'sidebar.rede' },
        ],
    },
    {
        labelKey: 'sidebar.grupoSistema',
        items: [
            { to: '/explorar', search: { entity: 'eventos' }, icon: Activity, labelKey: 'sidebar.eventos' },
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
    // Entidade ativa do Explorer, com o MESMO default do Explorer.tsx ('notas'):
    // em /explorar sem ?entity= a lente é Notas, então o item Notas deve destacar
    // (o activeOptions/includeSearch sozinho não casa quando entity está ausente).
    const loc = useLocation();
    const emExplorar = loc.pathname === '/explorar';
    const entityAtiva = emExplorar
        ? ((loc.search as { entity?: string }).entity ?? 'notas')
        : undefined;

    return (
        <nav
            data-testid="app-sidebar"
            data-expanded={expanded}
            aria-label={t('sidebar.grupoGeral')}
            className={`relative hidden shrink-0 flex-col gap-1 border-r bg-sidebar py-3 transition-[width] duration-200 md:flex ${expanded ? 'w-60 px-3' : 'w-[64px] items-center px-2'}`}
        >
            {/* Toggle flutuante na borda direita (NOTA-135): meia-pílula ancorada
                na divisa rail/conteúdo, verticalmente no topo, em ambos os estados. */}
            <ToggleBtn expanded={expanded} onClick={toggle} t={t} />

            {/* Marca no topo: logo completo (arte + texto) quando expandido;
                só a arte (mark) quando colapsado, onde o texto não caberia. */}
            <div className={`mb-2 flex h-9 items-center ${expanded ? '' : 'justify-center'}`}>
                <Link to={'/' as string} aria-label="notagrafo" className="flex items-center rounded-[10px]">
                    {expanded ? (
                        <img src="/notagrafo-logo.png" alt="notagrafo" className="h-8 w-auto" />
                    ) : (
                        <img src="/notagrafo-mark.png" alt="notagrafo" className="size-8" />
                    )}
                </Link>
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
                        {g.items.map((r) => <RailIcon key={r.to + (r.search?.entity ?? '')} def={r} expanded={expanded} t={t} entityAtiva={entityAtiva} />)}
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
            className="absolute -right-3 top-5 z-20 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>svg]:size-[13px]"
        >
            {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </button>
    );
}

function RailIcon({ def, expanded, t, entityAtiva }: { def: RailDef; expanded: boolean; t: (k: string) => string; entityAtiva?: string }): JSX.Element {
    const { to, search, icon: Icon, labelKey, exact } = def;
    // Item de entidade do Explorer (/explorar?entity=X): destaque calculado por
    // nós, comparando com a entidade ativa (que já resolve o default 'notas' em
    // /explorar puro). Assim o item Notas destaca mesmo sem ?entity= na URL.
    const isEntity = to === '/explorar' && !!search?.entity;
    const entityActive = isEntity && entityAtiva === search!.entity;
    const activeClasses = 'bg-primary/12 font-medium text-primary';
    // Itens de entidade: destaque 100% controlado por `entityActive` (o matcher
    // do router casaria TODOS os /explorar pelo pathname, então não usamos a
    // classe .active neles). Itens não-entidade: matcher normal do router.
    const link = (
        <Link
            to={to as never}
            search={(search ?? undefined) as never}
            activeOptions={{ exact: exact ?? false }}
            aria-label={t(labelKey)}
            aria-current={entityActive ? 'page' : undefined}
            className={`flex h-9 items-center rounded-[10px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-[18px] ${expanded ? 'gap-2.5 px-2.5' : 'w-10 justify-center'} ${isEntity ? (entityActive ? activeClasses : '') : '[&.active]:bg-primary/12 [&.active]:font-medium [&.active]:text-primary'}`}
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
