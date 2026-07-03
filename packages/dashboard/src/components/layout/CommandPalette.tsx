import { type JSX, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    Download,
    FileText,
    Home,
    Languages,
    type LucideIcon,
    Moon,
    Package,
    ReceiptText,
    Settings,
    Sun,
    Waypoints,
} from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store.js';
import { setIdioma, type Idioma } from '../../i18n/index.js';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '../ui/command.js';

interface NavItem {
    to: string;
    icon: LucideIcon;
    key: string;
}

const ROTAS: NavItem[] = [
    { to: '/', icon: Home, key: 'sidebar.overview' },
    { to: '/nf', icon: FileText, key: 'sidebar.nfs' },
    { to: '/empresas', icon: Building2, key: 'sidebar.empresas' },
    { to: '/produtos', icon: Package, key: 'sidebar.produtos' },
    { to: '/impostos', icon: ReceiptText, key: 'sidebar.impostos' },
    { to: '/grafo', icon: Waypoints, key: 'sidebar.grafo' },
    { to: '/exportacoes', icon: Download, key: 'sidebar.exportacoes' },
    { to: '/configuracoes', icon: Settings, key: 'sidebar.configuracoes' },
];

/** Chave de acesso da NF-e: exatamente 44 dígitos. */
const CHAVE_RE = /^\d{44}$/;

/**
 * Command palette (Ctrl/Cmd+K): navega entre as rotas, vai direto ao detalhe de
 * uma NF quando o texto digitado é uma chave de 44 dígitos, e alterna tema/idioma.
 * Montada no AppShell.
 */
export function CommandPalette(): JSX.Element {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const tema = useThemeStore((s) => s.tema);
    const toggleTema = useThemeStore((s) => s.toggle);
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');

    // Atalho global Ctrl/Cmd+K.
    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    function run(fn: () => void): void {
        setOpen(false);
        setQ('');
        fn();
    }

    const chave = q.trim();
    const isChave = CHAVE_RE.test(chave);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder={t('comando.placeholder')}
                value={q}
                onValueChange={setQ}
            />
            <CommandList>
                <CommandEmpty>{t('comum.vazio')}</CommandEmpty>

                {isChave && (
                    <>
                        <CommandGroup heading={t('comando.nf')}>
                            <CommandItem
                                // value fixo para não ser filtrado pela busca (que é a própria chave)
                                value={`ir-nf-${chave}`}
                                onSelect={() => run(() => void navigate({ to: '/nf/$chave' as string, params: { chave } as never }))}
                            >
                                <FileText />
                                {t('comando.irParaNf')} <span className="ml-1 font-mono text-xs text-muted-foreground">{chave.slice(0, 8)}…{chave.slice(-6)}</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                <CommandGroup heading={t('comando.navegar')}>
                    {ROTAS.map((r) => (
                        <CommandItem key={r.to} onSelect={() => run(() => void navigate({ to: r.to as string }))}>
                            <r.icon />
                            {t(r.key)}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading={t('comando.acoes')}>
                    <CommandItem onSelect={() => run(toggleTema)}>
                        {tema === 'claro' ? <Moon /> : <Sun />}
                        {t('header.alternarTema')}
                    </CommandItem>
                    <CommandItem
                        onSelect={() => run(() => setIdioma(i18n.language === 'pt-BR' ? 'en' : ('pt-BR' as Idioma)))}
                    >
                        <Languages />
                        {t('header.alternarIdioma')}
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
