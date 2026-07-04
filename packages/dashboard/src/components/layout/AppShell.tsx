import { type JSX, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useThemeStore } from '../../stores/theme.store.js';
import { Toaster } from '../ui/sonner.js';
import { TooltipProvider } from '../ui/tooltip.js';
import { ExportWatcher } from './ExportWatcher.js';
import { CommandPalette } from './CommandPalette.js';
import { AppSidebar } from './AppSidebar.js';
import { Topbar } from './Topbar.js';
import { InsightsPanel } from './InsightsPanel.js';

/** Rotas full-bleed: trazem seu próprio layout/altura e não recebem o padding
 *  padrão do Outlet (Explorer tem header próprio; Grafo é um canvas absoluto). */
const FULL_BLEED = ['/explorar', '/grafo'];

/**
 * Shell das rotas autenticadas (redesign BI, NOTA-119). Layout permanente em
 * três zonas: rail de ícones à esquerda (AppSidebar), Topbar no topo e, no corpo,
 * o conteúdo da rota (Outlet) com uma coluna de Insights colapsável à direita.
 * Transversais montados aqui: Toaster, ExportWatcher headless e a Command Palette.
 */
export function AppShell(): JSX.Element {
    const tema = useThemeStore((s) => s.tema);
    const [insightsOpen, setInsightsOpen] = useState(false);
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const fullBleed = FULL_BLEED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    return (
        <TooltipProvider delayDuration={300}>
            <div className="grid h-svh grid-cols-[60px_1fr] overflow-hidden bg-background">
                <AppSidebar />
                <div className="flex min-w-0 flex-col overflow-hidden">
                    <Topbar insightsOpen={insightsOpen} onToggleInsights={() => setInsightsOpen((o) => !o)} />
                    <div className={`grid min-h-0 flex-1 overflow-hidden ${insightsOpen ? 'grid-cols-[1fr_320px]' : 'grid-cols-[1fr]'}`}>
                        {fullBleed ? (
                            <div className="flex min-w-0 flex-col overflow-hidden">
                                <Outlet />
                            </div>
                        ) : (
                            <div className="min-w-0 overflow-auto p-4 md:p-6">
                                <Outlet />
                            </div>
                        )}
                        {insightsOpen && <InsightsPanel />}
                    </div>
                </div>
                {/* theme explícito: nosso tema vem do theme.store, não do next-themes. */}
                <Toaster theme={tema === 'escuro' ? 'dark' : 'light'} richColors position="bottom-right" />
                <ExportWatcher />
                <CommandPalette />
            </div>
        </TooltipProvider>
    );
}
