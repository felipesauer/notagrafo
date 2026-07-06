import { type JSX } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useThemeStore } from '../../stores/theme.store.js';
import { useUIStore } from '../../stores/ui.store.js';
import { Toaster } from '../ui/sonner.js';
import { TooltipProvider } from '../ui/tooltip.js';
import { ExportWatcher } from './ExportWatcher.js';
import { CommandPalette } from './CommandPalette.js';
import { AppSidebar } from './AppSidebar.js';
import { MobileNav } from './MobileNav.js';
import { Topbar } from './Topbar.js';
import { InsightsPanel } from './InsightsPanel.js';

/** Rotas full-bleed: trazem seu próprio layout/altura e não recebem o padding
 *  padrão do Outlet (Explorer tem header próprio; Grafo é um canvas absoluto). */
const FULL_BLEED = ['/explorar', '/grafo'];

/**
 * Shell das rotas autenticadas (redesign BI, NOTA-119 / responsivo NOTA-125).
 * Desktop: rail à esquerda (AppSidebar, colapsável/expansível) + Topbar + conteúdo
 * (Outlet) com coluna de Insights colapsável à direita. Mobile (<md): o rail some
 * e a navegação vem do MobileNav (Sheet via hambúrguer na Topbar); o grid colapsa
 * para uma coluna única. Transversais: Toaster, ExportWatcher, Command Palette.
 *
 * Enquadramento (ADR-17): o padding lateral vive AQUI (p-4 md:p-6 lg:p-8), uniforme
 * entre telas; o teto de largura de cada página vem do PageContainer. O painel
 * Insights só aparece na Home (`/`) — nas demais telas seria ruído (Grafo/Explorer/
 * Config/Exports têm seus próprios contextos e ganham a largura toda).
 */
export function AppShell(): JSX.Element {
    const tema = useThemeStore((s) => s.tema);
    const insightsOpen = useUIStore((s) => s.insightsOpen);
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const fullBleed = FULL_BLEED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isHome = pathname === '/';
    const showInsights = isHome && insightsOpen;

    return (
        <TooltipProvider delayDuration={300}>
            {/* 1ª coluna some no mobile (rail escondido); no desktop a AppSidebar
                dita a própria largura (60px ou expandida) via `w-*`, então usamos
                width:auto na trilha do grid. */}
            <div className="grid h-svh grid-cols-1 grid-rows-1 overflow-hidden bg-background md:grid-cols-[auto_1fr]">
                <AppSidebar />
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                    <Topbar />
                    <div className={`grid min-h-0 flex-1 grid-rows-1 overflow-hidden ${showInsights ? 'grid-cols-1 xl:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
                        {fullBleed ? (
                            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                                <Outlet />
                            </div>
                        ) : (
                            <div className="h-full min-w-0 overflow-auto p-4 md:p-6 lg:p-8">
                                <Outlet />
                            </div>
                        )}
                        {/* Insights só ocupa coluna a partir de xl; abaixo disso fica oculto
                            (evita espremer o conteúdo em telas médias). Só na Home. */}
                        {showInsights && (
                            <div className="hidden xl:block">
                                <InsightsPanel />
                            </div>
                        )}
                    </div>
                </div>
                {/* theme explícito: nosso tema vem do theme.store, não do next-themes. */}
                <Toaster theme={tema === 'escuro' ? 'dark' : 'light'} richColors position="bottom-right" />
                <ExportWatcher />
                <CommandPalette />
                <MobileNav />
            </div>
        </TooltipProvider>
    );
}
