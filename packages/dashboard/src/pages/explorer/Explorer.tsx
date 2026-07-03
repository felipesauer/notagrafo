import { type JSX, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
    Activity, Building2, FileText, type LucideIcon, Network, Package, ReceiptText, Search, Upload, Waypoints,
} from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { EmptyState } from '../../components/shared.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { ExplorerNotas } from './ExplorerNotas.js';
import { ExplorerEmpresas } from './ExplorerEmpresas.js';
import { ExplorerProdutos } from './ExplorerProdutos.js';
import { ExplorerImpostos } from './ExplorerImpostos.js';

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

/** Views salvas de exemplo (persistência real vem na NOTA-112). */
const VIEWS = [
    { nome: 'Rejeitadas do mês', entity: 'notas' as EntityKey, cor: 'var(--status-cancelada, #f87171)', status: 'cancelada' },
    { nome: 'ICMS-ST alto', entity: 'notas' as EntityKey, cor: 'var(--chart-3)', status: '' },
];

/**
 * Explorador unificado (nova navegação, modelo Linear): a NF-e é a entidade
 * central; empresas/produtos/impostos são recortes; rede/eventos são lentes.
 * Uma casca em "L invertido" (rail de entidades + header contextual) troca o
 * conteúdo sem trocar de página. Passo 1: só a entidade Notas tem conteúdo real.
 */
const ENTITY_KEYS = new Set<string>(ENTITIES.map((e) => e.key));

export function ExplorerPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { entity?: string; peek?: string; q?: string; status?: string };

    // A entidade ativa e os filtros vivem na URL (linkáveis). A busca tem um
    // espelho local para digitação fluida, com debounce antes de ir pra query.
    const entity: EntityKey = (search.entity && ENTITY_KEYS.has(search.entity) ? search.entity : 'notas') as EntityKey;
    const status = search.status ?? '';
    const [qInput, setQInput] = useState(search.q ?? '');
    const q = useDebouncedValue(qInput, 300);

    const explorar = ENTITIES.filter((e) => e.group === 'explorar');
    const analise = ENTITIES.filter((e) => e.group === 'analise');
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

    return (
        // rail de entidades (esquerda, dentro do conteúdo) + área principal — o "L"
        <div className="-m-4 flex h-[calc(100vh-3.25rem)] md:-m-6">
            {/* Rail de entidades */}
            <div className="hidden w-52 shrink-0 flex-col border-r bg-sidebar/40 md:flex">
                <RailGroup label={t('sidebar.grupoDados')}>
                    {explorar.map((e) => <RailItem key={e.key} e={e} active={entity === e.key} onClick={() => trocar(e.key)} t={t} />)}
                </RailGroup>
                <RailGroup label={t('sidebar.grupoAnalise')}>
                    {analise.map((e) => <RailItem key={e.key} e={e} active={entity === e.key} onClick={() => trocar(e.key)} t={t} />)}
                </RailGroup>
                <RailGroup label={t('explorer.minhasViews')}>
                    {VIEWS.map((v) => (
                        <button key={v.nome} type="button" onClick={() => { trocar(v.entity); if (v.status) setStatus(v.status); }}
                            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                            <span className="size-1.5 shrink-0 rounded-[2px]" style={{ background: v.cor }} />
                            <span className="truncate">{v.nome}</span>
                        </button>
                    ))}
                </RailGroup>
            </div>

            {/* Área principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Seletor de entidade horizontal (mobile — o rail vertical some) */}
                <div className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
                    {ENTITIES.map((e) => (
                        <button key={e.key} type="button" onClick={() => trocar(e.key)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] ${entity === e.key ? 'bg-sidebar-accent font-medium text-foreground' : 'text-muted-foreground'}`}>
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
                        {entity === 'notas' && (
                            <>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('nf.filtros.buscaUnica')} className="h-8 w-56 pl-8" />
                                </div>
                                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} wrapperClassName="w-36">
                                    <option value="">{t('nf.todosStatus')}</option>
                                    <option value="ativa">{t('nf.statusAtiva')}</option>
                                    <option value="cancelada">{t('nf.statusCancelada')}</option>
                                    <option value="denegada">{t('nf.statusDenegada')}</option>
                                </NativeSelect>
                                <Button type="button" size="sm"><Upload /> {t('nf.uploadTitulo')}</Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Conteúdo da entidade */}
                <div className="flex-1 overflow-auto">
                    {entity === 'notas' ? (
                        <ExplorerNotas q={q} status={status} peek={search.peek} onPeek={setPeek} />
                    ) : entity === 'empresas' ? (
                        <ExplorerEmpresas peek={search.peek} onPeek={setPeek} />
                    ) : entity === 'produtos' ? (
                        <ExplorerProdutos />
                    ) : entity === 'impostos' ? (
                        <ExplorerImpostos />
                    ) : (
                        <div className="grid h-full place-items-center p-8 text-center">
                            <div className="max-w-sm">
                                <Waypoints className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                                <EmptyState mensagem={t('explorer.emBreve', { entidade: t(meta.labelKey) })} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RailGroup({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="px-2 py-2">
            <p className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}

function RailItem({ e, active, onClick, t }: { e: EntityDef; active: boolean; onClick: () => void; t: (k: string) => string }): JSX.Element {
    return (
        <button type="button" onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${active ? 'bg-sidebar-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}>
            <e.icon className="size-[15px] shrink-0" /> {t(e.labelKey)}
        </button>
    );
}
