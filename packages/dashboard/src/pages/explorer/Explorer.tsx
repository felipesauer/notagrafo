import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
    Activity, Bookmark, Building2, FileText, Filter, type LucideIcon,
    Network, Package, ReceiptText, Search, Star, Upload, X,
} from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover.js';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.js';
import { UploadModal } from '../../components/UploadModal.js';
import { PageContainer } from '../../components/layout/PageContainer.js';
import { DensityToggle } from '../../components/DensityToggle.js';
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
        dataEmissaoInicio?: string; dataEmissaoFim?: string; valorTotalMin?: string;
        valorTotalMax?: string; tipoNF?: string; finalidade?: string; cfop?: string;
    };

    const entity: EntityKey = (search.entity && ENTITY_KEYS.has(search.entity) ? search.entity : 'notas') as EntityKey;
    const status = search.status ?? '';
    const recorte = {
        ...(search.ufEmitente ? { ufEmitente: search.ufEmitente } : {}),
        ...(search.cnpjEmitente ? { cnpjEmitente: search.cnpjEmitente } : {}),
        ...(search.ncm ? { ncm: search.ncm } : {}),
        ...(search.comImposto ? { comImposto: search.comImposto } : {}),
        ...(search.dataEmissaoInicio ? { dataEmissaoInicio: search.dataEmissaoInicio } : {}),
        ...(search.dataEmissaoFim ? { dataEmissaoFim: search.dataEmissaoFim } : {}),
        ...(search.valorTotalMin ? { valorTotalMin: search.valorTotalMin } : {}),
        ...(search.valorTotalMax ? { valorTotalMax: search.valorTotalMax } : {}),
        ...(search.tipoNF ? { tipoNF: search.tipoNF } : {}),
        ...(search.finalidade ? { finalidade: search.finalidade } : {}),
        ...(search.cfop ? { cfop: search.cfop } : {}),
    };
    const temRecorte = Object.keys(recorte).length > 0;
    const [qInput, setQInput] = useState(search.q ?? '');
    const [modalAberto, setModalAberto] = useState(false);
    // Busca client-side das entidades cujo ranking já vem inteiro (empresas/produtos):
    // filtra as linhas em memória, sem tocar a API. Notas usa o `q` server-side acima.
    const [buscaLocal, setBuscaLocal] = useState('');
    const q = useDebouncedValue(qInput, 300);
    const { views, add: addView, remove: removeView } = useSavedViews();

    const meta = ENTITIES.find((e) => e.key === entity)!;

    function trocar(e: EntityKey): void {
        setQInput('');
        setBuscaLocal('');
        void navigate({ to: '/explorar' as string, search: { entity: e } as never });
    }
    function setStatus(s: string): void {
        void navigate({ to: '/explorar' as string, search: { ...search, status: s || undefined } as never });
    }
    /** Atualiza um campo de filtro avançado no search (string vazia limpa). */
    function setFiltro(campo: string, valor: string): void {
        void navigate({ to: '/explorar' as string, search: { ...search, [campo]: valor || undefined } as never });
    }
    /** Limpa TODOS os filtros avançados de uma vez (um único navigate — chamar
     *  setFiltro em loop não funciona: as navegações partem do mesmo snapshot de
     *  search e se sobrescrevem, restando só a última). */
    function limparFiltros(): void {
        const limpo = { ...search };
        for (const c of ['dataEmissaoInicio', 'dataEmissaoFim', 'valorTotalMin', 'valorTotalMax', 'tipoNF', 'finalidade', 'cfop', 'ncm']) {
            delete (limpo as Record<string, unknown>)[c];
        }
        void navigate({ to: '/explorar' as string, search: limpo as never });
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
            {/* Tabs de entidade — só no MOBILE (md:hidden): no desktop o rail
                lateral já navega entre entidades e o header contextual abaixo
                indica a ativa, então as tabs seriam redundantes. No mobile o rail
                vira drawer (escondido), então as tabs dão a troca rápida visível. */}
            <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
                {ENTITIES.map((e) => (
                    <button key={e.key} type="button" onClick={() => trocar(e.key)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-2sm font-medium transition-colors ${entity === e.key ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}>
                        <e.icon className="size-4" /> {t(e.labelKey)}
                    </button>
                ))}
            </div>

            {/* Header contextual da entidade. A borda vai de ponta a ponta
                (separador), mas o conteúdo interno alinha com a tabela abaixo
                (mesmo PageContainer + padding do conteúdo). */}
            <div className="border-b">
              <PageContainer width="wide" className="flex flex-wrap items-center gap-2 px-4 py-2.5 md:px-6 lg:px-8">
                <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <meta.icon className="size-4 text-muted-foreground" /> {t(meta.labelKey)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <DensityToggle />
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
                                <option value="inutilizada">{t('nf.statusInutilizada')}</option>
                            </NativeSelect>
                            <NFFilters search={search} onChange={setFiltro} onClearAll={limparFiltros} t={t} />
                            {podeSalvar && (
                                <Button type="button" variant="outline" size="sm" onClick={salvarView}><Bookmark /> {t('explorer.salvarView')}</Button>
                            )}
                            <Button type="button" size="sm" onClick={() => setModalAberto(true)}><Upload /> {t('nf.uploadTitulo')}</Button>
                        </>
                    )}
                    {(entity === 'empresas' || entity === 'produtos') && (
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} placeholder={t('explorer.filtrar')} className="h-8 w-56 pl-8" />
                        </div>
                    )}
                </div>
              </PageContainer>
            </div>

            {/* Faixa de filtro ativo (drill-through) — mesmo enquadramento. */}
            {entity === 'notas' && temRecorte && (
                <div className="border-b bg-muted/30">
                  <PageContainer width="wide" className="flex flex-wrap items-center gap-2 px-4 py-2 md:px-6 lg:px-8">
                    <span className="text-xs text-muted-foreground">{t('explorer.filtrandoPor')}</span>
                    {search.ufEmitente && <FilterChip label={t('nf.filtros.ufEmitente')} value={search.ufEmitente} />}
                    {search.cnpjEmitente && <FilterChip label={t('nf.filtros.cnpjEmitente')} value={cnpjChip(search.cnpjEmitente)} />}
                    {search.ncm && <FilterChip label={t('nf.ncm')} value={search.ncm} />}
                    {search.comImposto && <FilterChip label={t('grafo.nfsComImposto')} value="" />}
                    <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={limparRecorte}>
                        <X /> {t('nf.filtros.limparTudo')}
                    </Button>
                  </PageContainer>
                </div>
            )}

            {/* Conteúdo da entidade — rola na PÁGINA (estilo do feed de Eventos):
                as tabelas vivem em cards com paginação (10/pág), sem scroll interno
                próprio. Padding uniforme (p-4 md:p-6 lg:p-8) = mesma margem das
                demais telas; PageContainer dá o teto de largura (ADR-17). */}
            <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <PageContainer width={entity === 'rede' ? 'full' : 'wide'}>
                    {entity === 'notas' ? (
                        <ExplorerNotas q={q} status={status} recorte={recorte} peek={search.peek} onPeek={setPeek} />
                    ) : entity === 'empresas' ? (
                        <ExplorerEmpresas peek={search.peek} onPeek={setPeek} busca={buscaLocal} />
                    ) : entity === 'produtos' ? (
                        <ExplorerProdutos peek={search.peek} onPeek={setPeek} busca={buscaLocal} />
                    ) : entity === 'impostos' ? (
                        <ExplorerImpostos />
                    ) : entity === 'rede' ? (
                        <div className="min-h-0"><NetworkContent /></div>
                    ) : (
                        <EventsContent />
                    )}
                </PageContainer>
            </div>

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} />}
        </div>
    );
}

/** Formata um CNPJ (14 dígitos) para o chip; devolve intacto se não for. */
function cnpjChip(c: string): string {
    return c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
}

interface NFSearch {
    dataEmissaoInicio?: string; dataEmissaoFim?: string; valorTotalMin?: string;
    valorTotalMax?: string; tipoNF?: string; finalidade?: string; cfop?: string; ncm?: string;
}

/**
 * Painel de filtros avançados de NF (redesign BI / NOTA-125 D): expõe os filtros
 * que a API /nf já aceita e a UI escondia (datas, valor min/max, tipo, finalidade,
 * CFOP, NCM). Escreve no search da URL (linkável). O nº de filtros ativos aparece
 * no botão. Selects nativos (ADR-10). Comprovante do que a API oferece em uso.
 */
function NFFilters({ search, onChange, onClearAll, t }: { search: NFSearch; onChange: (campo: string, valor: string) => void; onClearAll: () => void; t: (k: string) => string }): JSX.Element {
    const campos: (keyof NFSearch)[] = ['dataEmissaoInicio', 'dataEmissaoFim', 'valorTotalMin', 'valorTotalMax', 'tipoNF', 'finalidade', 'cfop', 'ncm'];
    const ativos = campos.filter((c) => search[c]).length;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant={ativos > 0 ? 'default' : 'outline'} size="sm">
                    <Filter /> {t('nf.filtros.titulo')}{ativos > 0 ? ` · ${ativos}` : ''}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <FiltroCampo label={t('nf.filtros.emissaoInicio')} type="date" value={search.dataEmissaoInicio} onChange={(v) => onChange('dataEmissaoInicio', v)} />
                    <FiltroCampo label={t('nf.filtros.emissaoFim')} type="date" value={search.dataEmissaoFim} onChange={(v) => onChange('dataEmissaoFim', v)} />
                    <FiltroCampo label={t('nf.filtros.valorMin')} type="number" value={search.valorTotalMin} onChange={(v) => onChange('valorTotalMin', v)} />
                    <FiltroCampo label={t('nf.filtros.valorMax')} type="number" value={search.valorTotalMax} onChange={(v) => onChange('valorTotalMax', v)} />
                    <FiltroCampo label="CFOP" value={search.cfop} onChange={(v) => onChange('cfop', v)} />
                    <FiltroCampo label="NCM" value={search.ncm} onChange={(v) => onChange('ncm', v)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                        <Label className="text-2xs text-muted-foreground">{t('nf.filtros.tipoNF')}</Label>
                        <NativeSelect value={search.tipoNF ?? ''} onChange={(e) => onChange('tipoNF', e.target.value)} wrapperClassName="w-full">
                            <option value="">{t('nf.filtros.todos')}</option>
                            <option value="entrada">{t('nf.filtros.tipoEntrada')}</option>
                            <option value="saida">{t('nf.filtros.tipoSaida')}</option>
                        </NativeSelect>
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-2xs text-muted-foreground">{t('nf.filtros.finalidade')}</Label>
                        <NativeSelect value={search.finalidade ?? ''} onChange={(e) => onChange('finalidade', e.target.value)} wrapperClassName="w-full">
                            <option value="">{t('nf.filtros.todos')}</option>
                            <option value="normal">{t('nf.filtros.finNormal')}</option>
                            <option value="complementar">{t('nf.filtros.finComplementar')}</option>
                            <option value="ajuste">{t('nf.filtros.finAjuste')}</option>
                            <option value="devolucao">{t('nf.filtros.finDevolucao')}</option>
                        </NativeSelect>
                    </div>
                </div>
                {ativos > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onClearAll}>
                        <X /> {t('nf.filtros.limparTudo')}
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}

function FiltroCampo({ label, type = 'text', value, onChange }: { label: string; type?: string; value?: string; onChange: (v: string) => void }): JSX.Element {
    return (
        <div className="grid gap-1">
            <Label className="text-2xs text-muted-foreground">{label}</Label>
            <Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-8" />
        </div>
    );
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
