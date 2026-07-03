import { type JSX } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    ChevronsUpDown,
    Download,
    FileText,
    Home,
    type LucideIcon,
    LogOut,
    Package,
    ReceiptText,
    Settings,
    Waypoints,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '../ui/sidebar.js';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu.js';
import { Avatar, AvatarFallback } from '../ui/avatar.js';

interface NavItem {
    to: string;
    icon: LucideIcon;
    key: string;
}

const ITENS: NavItem[] = [
    { to: '/', icon: Home, key: 'sidebar.overview' },
    { to: '/nf', icon: FileText, key: 'sidebar.nfs' },
    { to: '/empresas', icon: Building2, key: 'sidebar.empresas' },
    { to: '/produtos', icon: Package, key: 'sidebar.produtos' },
    { to: '/impostos', icon: ReceiptText, key: 'sidebar.impostos' },
    { to: '/grafo', icon: Waypoints, key: 'sidebar.grafo' },
    { to: '/exportacoes', icon: Download, key: 'sidebar.exportacoes' },
    { to: '/configuracoes', icon: Settings, key: 'sidebar.configuracoes' },
];

/** Iniciais para o avatar (nome ou e-mail). */
function initials(source: string): string {
    const parts = source.trim().split(/[\s@.]+/).filter(Boolean);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

/** Menu do usuário no rodapé da sidebar (nome/e-mail + sair). */
function UserMenu(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const clear = useAuthStore((s) => s.clear);
    const nome = user?.nome ?? user?.email ?? '—';
    const email = user?.email ?? '';

    function logout(): void {
        clear();
        void navigate({ to: '/login' });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <Avatar className="size-8 rounded-md">
                        <AvatarFallback className="rounded-md text-xs uppercase">
                            {initials(nome).toUpperCase() || '—'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{nome}</span>
                        {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="min-w-56 rounded-lg">
                <DropdownMenuLabel className="font-normal">
                    <div className="grid text-sm leading-tight">
                        <span className="truncate font-medium">{nome}</span>
                        {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>
                    <LogOut />
                    {t('sidebar.sair')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Sidebar de navegação: 8 itens com ícones, colapsável para ícones + drawer mobile. */
export function NavSidebar(): JSX.Element {
    const { t } = useTranslation();

    return (
        <Sidebar collapsible="icon" data-testid="app-sidebar">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <ReceiptText className="size-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                        notagrafo
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {ITENS.map((item) => (
                                <SidebarMenuItem key={item.to}>
                                    <SidebarMenuButton asChild tooltip={t(item.key)}>
                                        <Link
                                            to={item.to as string}
                                            // exato só na raiz; as demais casam o prefixo
                                            activeOptions={{ exact: item.to === '/' }}
                                            activeProps={{ 'data-active': 'true' }}
                                        >
                                            <item.icon />
                                            <span>{t(item.key)}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <UserMenu />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
