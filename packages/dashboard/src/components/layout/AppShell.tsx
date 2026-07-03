import { type JSX } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useThemeStore } from '../../stores/theme.store.js';
import { SidebarInset, SidebarProvider } from '../ui/sidebar.js';
import { Toaster } from '../ui/sonner.js';
import { NavSidebar } from './NavSidebar.js';
import { SiteHeader } from './SiteHeader.js';
import { ExportWatcher } from './ExportWatcher.js';

/**
 * Shell das rotas autenticadas: sidebar colapsável + header + conteúdo. Monta o
 * Toaster (sonner, ligado ao tema) e o ExportWatcher headless. Substitui o
 * antigo AppLayout/Sidebar/Header.
 */
export function AppShell(): JSX.Element {
    const tema = useThemeStore((s) => s.tema);
    return (
        <SidebarProvider>
            <NavSidebar />
            <SidebarInset>
                <SiteHeader />
                <div className="flex-1 p-4 md:p-6">
                    <Outlet />
                </div>
            </SidebarInset>
            {/* theme explícito: nosso tema vem do theme.store, não do next-themes. */}
            <Toaster theme={tema === 'escuro' ? 'dark' : 'light'} richColors position="bottom-right" />
            <ExportWatcher />
        </SidebarProvider>
    );
}
