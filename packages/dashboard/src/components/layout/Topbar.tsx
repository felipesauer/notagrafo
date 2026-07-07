import { type JSX } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Languages, Lightbulb, Menu, Moon, Search, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store.js';
import { useUIStore } from '../../stores/ui.store.js';
import { setIdioma, type Idioma } from '../../i18n/index.js';
import { Button } from '../ui/button.js';

/** Rótulo da página atual pelo primeiro segmento do path (breadcrumb). */
function pageLabelKey(pathname: string): string {
    if (pathname === '/') return 'sidebar.inicio';
    if (pathname.startsWith('/explore')) return 'sidebar.explorar';
    if (pathname.startsWith('/nf/')) return 'comando.nf';
    if (pathname.startsWith('/graph')) return 'sidebar.grafo';
    if (pathname.startsWith('/exports')) return 'sidebar.exportacoes';
    if (pathname.startsWith('/settings')) return 'sidebar.configuracoes';
    return 'sidebar.inicio';
}

/** Abre a Command Palette (Cmd+K) via evento sintético — a palette escuta no document. */
function openCommand(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
}

/**
 * Topbar global do redesign BI (NOTA-119): breadcrumb à esquerda, busca central
 * (dispara Cmd+K) e, à direita, toggles de tema/idioma, o toggle do painel de
 * Insights e o avatar. Absorve os controles de tema/idioma que antes viviam no
 * rail do Explorer e no header secundário (removidos nesta fase).
 */
export function Topbar(): JSX.Element {
    const { t, i18n } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const toggleTema = useThemeStore((s) => s.toggle);
    const insightsOpen = useUIStore((s) => s.insightsOpen);
    const toggleInsights = useUIStore((s) => s.toggleInsights);
    const openMobileNav = useUIStore((s) => s.setMobileNav);
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    return (
        <header className="relative flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            {/* Hambúrguer só no mobile (o rail lateral some abaixo de md). */}
            <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => openMobileNav(true)} aria-label={t('sidebar.grupoGeral')}>
                <Menu />
            </Button>
            <div className="flex items-center gap-1.5 text-2sm text-muted-foreground">
                <span className="font-semibold text-foreground">notagrafo</span>
                <ChevronRight className="size-3.5 text-muted-foreground/60" />
                <span>{t(pageLabelKey(pathname))}</span>
            </div>

            {/* busca centralizada (dispara Cmd+K) — só de md pra cima (no mobile a
                barra absoluta colidia com o breadcrumb; lá vira uma lupa compacta). */}
            <button
                type="button"
                onClick={openCommand}
                className="absolute left-1/2 top-1/2 hidden w-[340px] max-w-[38vw] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border bg-muted/60 px-3 py-1.5 text-2sm text-muted-foreground transition-colors hover:border-border hover:bg-muted md:flex"
            >
                <Search className="size-4" />
                <span className="truncate">{t('comando.placeholder')}</span>
                <kbd className="ml-auto rounded border bg-background px-1.5 font-sans text-2xs font-semibold text-muted-foreground">⌘K</kbd>
            </button>

            <div className="ml-auto flex items-center gap-1">
                {/* busca compacta no mobile */}
                <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={openCommand} aria-label={t('comando.placeholder')}>
                    <Search />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={toggleTema} aria-label={t('header.alternarTema')}>
                    {tema === 'claro' ? <Moon /> : <Sun />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleInsights}
                    aria-label={t('sidebar.insights')}
                    aria-pressed={insightsOpen}
                    className={`hidden xl:inline-flex ${insightsOpen ? 'text-primary' : ''}`}
                >
                    <Lightbulb />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIdioma(i18n.language === 'pt-BR' ? 'en' : ('pt-BR' as Idioma))} aria-label={t('header.alternarIdioma')}>
                    <Languages /> {i18n.language === 'pt-BR' ? 'EN' : 'PT'}
                </Button>
                <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-chart-6 to-chart-1 text-xs font-bold text-white">
                    FS
                </div>
            </div>
        </header>
    );
}
