import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
    Activity, Bookmark, Building2, FileText, type LucideIcon,
    Network, Package, ReceiptText, Search, Star, Upload, X,
} from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.js';
import { UploadModal } from '../../components/UploadModal.js';
import { ExplorerNotas } from './ExplorerNotas.js';
import { ExplorerEmpresas } from './ExplorerEmpresas.js';
import { ExplorerProdutos } from './ExplorerProdutos.js';
import { ExplorerImpostos } from './ExplorerImpostos.js';
import { NetworkContent } from '../Network.js';
import { EventsContent } from '../Events.js';
import { useSavedViews } from './useSavedViews.js';

type EntityKey = 'notas' | 'empresas' | 'produtos' | 'impostos' | 'rede' | 'eventos';

interface EntityDef {
    key: EntityKey;
    icon: LucideIcon;
    labelKey: string;
    group: 'explorar' | 'analise';
}

const ENTITIES: EntityDef[] = [
    { key: 'notas', icon: FileText, labelKey: 'sidebar.nfs', group: 'explorar' },
    { key: 'empresas', icon: Building2, labelKey: 'sidebar.empresas', group: 'explorar' },
    { key: 'produtos', icon: Package, labelKey: 'sidebar.produtos', group: 'explorar' },
    { key: 'impostos', icon: ReceiptText, labelKey: 'sidebar.impostos', group: 'explorar' },
    { key: 'rede', icon: Network, labelKey: 'sidebar.rede', group: 'analise' },
    { key: 'eventos', icon: Activity, labelKey: 'sidebar.eventos', group: 'analise' },
];
const ENTITY_KEYS = new Set<string>(ENTITIES.map((e) => e.key));

/**
 * Explorador unificado (`/explorar`): a NF-e é a entidade central; empresas/
 * produtos/impostos são recortes; rede/eventos são lentes. O rail de navegação
 * global vive no AppShell (NOTA-119) — aqui ficam as TABS de entidade, o header
 * contextual (busca/status/upload/views) e o conteúdo, que troca sem navegar de
 * página. entity/peek/q/status/recorte vivem no search da URL (linkável).
 */
export function ExplorerPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as {
        entity?: string; peek?: string; q?: string; status?: string;
        ufEmitente?: string; cnpjEmitente?: string; ncm?: string; comImposto?: boolean;
    };

    const entity: EntityKey = (search.entity && ENTITY_KEYS.has(search.entity) ? search.entity : 'notas') as EntityKey;
    const status = search.status ?? '';
    const recorte = {
        ...(search.ufEmitente ? { ufEmitente: search.ufEmitente } : {}),
        ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
        ...(search.ncm ? { ncm: search.ncm } : {}),
        ...(search.comImposto ? { comImposto: search.comImposto } : {}),
    };
    const temRecorte = Object.keys(recorte).length > 0;
    const [qInput, setQInput] = useState(search.q ?? '');
    const [modalAberto, setModalAberto] = useState(false);
    const q = useDebouncedValue(qInput, 300);
    const { views, add: addView, remove: removeView } = useSavedViews();

    const meta = ENTITIES.find((e) => e.key === entity)!;

    function trocar(e: EntityKey): void {
        setQInput('');
        void navigate({ to: '/explorar' as string, search: { entity: e } as never });
    }
    function setStatus(s: string): void {
        void navigate({ to: '/explorar' as string, search: { ...search, status: s || undefined } as never });
    }
    function setPeek(chave: string | undefined): void {
        void navigate({ to: '/explorar' as string, search: { ...search, peek: chave } as never });
    }
    function limparRecorte(): void {
        void navigate({ to: '/explorar' as string, search: { entity, ...(qInput.trim() ? { q: qInput.trim() } : {}), ...(status ? { status } : {}) } as never });
    }
    function aplicarView(v: { entity: string; q?: string; status?: string }): void {
        setQInput(v.q ?? '');
        void navigate({ to: '/explorar' as string, search: { entity: v.entity, q: v.q || undefined, status: v.status || undefined } as never });
    }
    function salvarView(): void {
        const partes = [t(meta.labelKey), qInput.trim(), status].filter(Boolean);
        addView({ nome: partes.join(' · '), entity, ...(qInput.trim() ? { q: qInput.trim() } : {}), ...(status ? { status } : {}) });
    }
    const podeSalvar = entity === 'notas' && (!!qInput.trim() || !!status);

    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Tabs de entidade (substituem o rail): recortes e lentes. Mantidas como
                <button> para os e2e (getByRole('button', {name})). */}
            <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2">
                {ENTITIES.map((e) => (
                    <button key={e.key} type="button" onClick={() => trocar(e.key)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${entity === e.key ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}>
                        <e.icon className="size-4" /> {t(e.labelKey)}
                    </button>
                ))}
            </div>

            {/* Header contextual da entidade */}
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <meta.icon className="size-4 text-muted-foreground" /> {t(meta.labelKey)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <ViewsMenu views={views} onApply={aplicarView} onRemove={removeView} t={t} />
                    {entity === 'notas' && (
                        <>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('nf.filtros.buscaUnica')} className="h-8 w-56 pl-8" />
                            </div>
                            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} data-testid="nf-status-filter" wrapperClassName="w-36">
                                <option value="">{t('nf.todosStatus')}</option>
                                <option value="ativa">{t('nf.statusAtiva')}</option>
                                <option value="cancelada">{t('nf.statusCancelada')}</option>
                                <option value="denegada">{t('nf.statusDenegada')}</option>
                            </NativeSelect>
                            {podeSalvar && (
                                <Button type="button" variant="outline" size="sm" onClick={salvarView}><Bookmark /> {t('explorer.salvarView')}</Button>
                            )}
                            <Button type="button" size="sm" onClick={() => setModalAberto(true)}><Upload /> {t('nf.uploadTitulo')}</Button>
                        </>
                    )}
                </div>
            </div>

            {/* Faixa de filtro ativo (drill-through) */}
            {entity === 'notas' && temRecorte && (
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2">
                    <span className="text-xs text-muted-foreground">{t('explorer.filtrandoPor')}</span>
                    {search.ufEmitente && <FilterChip label={t('nf.filtros.ufEmitente')} value={search.ufEmitente} />}
                    {search.cnpjEmitente && <FilterChip label={t('nf.filtros.cnpjEmitente')} value={cnpjChip(search.cnpjEmitente)} />}
                    {search.ncm && <FilterChip label={t('nf.ncm')} value={search.ncm} />}
                    {search.comImposto && <FilterChip label={t('grafo.nfsComImposto')} value="" />}
                    <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={limparRecorte}>
                        <X /> {t('nf.filtros.limparTudo')}
                    </Button>
                </div>
            )}

            {/* Conteúdo da entidade */}
            <div className="flex-1 overflow-auto">
                {entity === 'notas' ? (
                    <ExplorerNotas q={q} status={status} recorte={recorte} peek={search.peek} onPeek={setPeek} />
                ) : entity === 'empresas' ? (
                    <ExplorerEmpresas peek={search.peek} onPeek={setPeek} />
                ) : entity === 'produtos' ? (
                    <ExplorerProdutos />
                ) : entity === 'impostos' ? (
                    <ExplorerImpostos />
                ) : entity === 'rede' ? (
                    <div className="p-4 md:p-6"><NetworkContent /></div>
                ) : (
                    <div className="p-4 md:p-6"><EventsContent /></div>
                )}
            </div>

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} />}
        </div>
    );
}

/** Formata um CNPJ (14 dígitos) para o chip; devolve intacto se não for. */
function cnpjChip(c: string): string {
    return c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
}

/** Chip somente-leitura de um filtro de recorte ativo (rótulo + valor). */
function FilterChip({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs">
            <span className="text-muted-foreground">{label}</span>
            {value && <span className="font-medium tabular-nums">{value}</span>}
        </span>
    );
}

/**
 * Menu de views salvas (antes vivia no rail). Fica no header do Explorer: um
 * botão "Views" que abre a lista favoritável (localStorage via useSavedViews),
 * com remoção. Some quando não há views salvas.
 */
function ViewsMenu({
    views, onApply, onRemove, t,
}: {
    views: { id: string; nome: string; entity: string; q?: string; status?: string }[];
    onApply: (v: { entity: string; q?: string; status?: string }) => void;
    onRemove: (id: string) => void;
    t: (k: string) => string;
}): JSX.Element | null {
    if (views.length === 0) return null;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm"><Star /> {t('explorer.minhasViews')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>{t('explorer.minhasViews')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {views.map((v) => (
                    <DropdownMenuItem key={v.id} onSelect={() => onApply(v)} className="group">
                        <Star className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{v.nome}</span>
                        <button type="button" aria-label={t('nf.filtros.remover')}
                            onClick={(e) => { e.stopPropagation(); onRemove(v.id); }}
                            className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:bg-foreground/10 group-hover:opacity-100">
                            <X className="size-3" />
                        </button>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
