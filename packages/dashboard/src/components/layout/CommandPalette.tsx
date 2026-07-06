import { type JSX, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Activity,
    Building2,
    Download,
    FileText,
    Home,
    Languages,
    type LucideIcon,
    Moon,
    Network,
    Package,
    ReceiptText,
    Settings,
    Sun,
} from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store.js';
import { useTopCompanies } from '../../api/hooks.js';
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
    search?: Record<string, string>;
    icon: LucideIcon;
    key: string;
}

/** Navegação: Início (Home BI) + explorador por entidade (via search) + sistema. */
const ROTAS: NavItem[] = [
    { to: '/', icon: Home, key: 'sidebar.inicio' },
    { to: '/explorar', search: { entity: 'notas' }, icon: FileText, key: 'sidebar.nfs' },
    { to: '/explorar', search: { entity: 'empresas' }, icon: Building2, key: 'sidebar.empresas' },
    { to: '/explorar', search: { entity: 'produtos' }, icon: Package, key: 'sidebar.produtos' },
    { to: '/explorar', search: { entity: 'impostos' }, icon: ReceiptText, key: 'sidebar.impostos' },
    { to: '/explorar', search: { entity: 'rede' }, icon: Network, key: 'sidebar.rede' },
    { to: '/explorar', search: { entity: 'eventos' }, icon: Activity, key: 'sidebar.eventos' },
    { to: '/exportacoes', icon: Download, key: 'sidebar.exportacoes' },
    { to: '/configuracoes', icon: Settings, key: 'sidebar.configuracoes' },
];

/** CNPJ só dígitos (para busca por documento na palette). */
const soDigitos = (s: string): string => s.replace(/\D/g, '');

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
    // ranking de empresas (poucas) para busca por nome/CNPJ na palette
    const empresas = useTopCompanies().data?.ranking ?? [];

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
    // empresas que casam por razão social ou CNPJ (só quando há 2+ chars e não é chave)
    const termo = q.trim().toLowerCase();
    const termoDoc = soDigitos(q);
    const empresasMatch = !isChave && termo.length >= 2
        ? empresas.filter((e) => e.razaoSocial.toLowerCase().includes(termo) || (termoDoc.length >= 3 && soDigitos(e.cnpj).includes(termoDoc))).slice(0, 5)
        : [];

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

                {empresasMatch.length > 0 && (
                    <>
                        <CommandGroup heading={t('sidebar.empresas')}>
                            {empresasMatch.map((e) => (
                                <CommandItem
                                    key={e.cnpj}
                                    value={`empresa-${e.cnpj}-${e.razaoSocial}`}
                                    onSelect={() => run(() => void navigate({ to: '/explorar' as string, search: { entity: 'empresas', peek: e.cnpj } as never }))}
                                >
                                    <Building2 />
                                    {e.razaoSocial}
                                    <span className="ml-auto font-mono text-xs text-muted-foreground">{e.cnpj}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                <CommandGroup heading={t('comando.navegar')}>
                    {ROTAS.map((r) => (
                        <CommandItem key={r.key} onSelect={() => run(() => void navigate({ to: r.to as string, search: (r.search ?? {}) as never }))}>
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
