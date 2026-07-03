import { type JSX } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useThemeStore } from '../../stores/theme.store.js';
import { Toaster } from '../ui/sonner.js';
import { ExportWatcher } from './ExportWatcher.js';
import { CommandPalette } from './CommandPalette.js';
import { SecondaryHeader } from './SecondaryHeader.js';

/**
 * Shell das rotas autenticadas. A navegação primária é o Explorer (a home `/`,
 * que traz seu próprio rail de entidades + views + tema/idioma). As telas
 * secundárias (Visão geral, detalhe da NF, grafo, exportações, config) ganham
 * um header leve (voltar ao explorador + tema/idioma). Aqui montamos o que é
 * transversal: Toaster, ExportWatcher headless e a Command Palette (Cmd+K).
 */
export function AppShell(): JSX.Element {
    const tema = useThemeStore((s) => s.tema);
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isExplorer = pathname === '/';

    return (
        <div className="min-h-svh bg-background">
            {isExplorer ? (
                <Outlet />
            ) : (
                <div className="mx-auto flex min-h-svh max-w-6xl flex-col">
                    <SecondaryHeader />
                    <div className="flex-1 p-4 md:p-6">
                        <Outlet />
                    </div>
                </div>
            )}
            {/* theme explícito: nosso tema vem do theme.store, não do next-themes. */}
            <Toaster theme={tema === 'escuro' ? 'dark' : 'light'} richColors position="bottom-right" />
            <ExportWatcher />
            <CommandPalette />
        </div>
    );
}
