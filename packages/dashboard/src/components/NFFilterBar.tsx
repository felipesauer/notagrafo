import { type JSX, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { type NFFiltros, filtrosAtivos, filtroLabel } from './FilterSidebar.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';
import { Badge } from './ui/badge.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Contagem de resultados: "N de M" (M = total sem paginação, vindo de meta.total). */
function ResultCount({ shown, total }: { shown: number; total?: number }): JSX.Element | null {
    const { t } = useTranslation();
    if (total === undefined) return null;
    return <span className="text-xs text-muted-foreground tabular-nums">{t('nf.filtros.contagem', { shown, total })}</span>;
}

/**
 * Barra de filtros no topo da lista de NFs (substitui a sidebar lateral). Busca
 * única (número/chave/empresa) com atalho "/", filtros comuns inline (status) e
 * o restante num Popover "+ filtros". Chips dos ativos + contagem N de M.
 * Mantém o contrato do NFList: q, status e o objeto NFFiltros avançado.
 */
export function NFFilterBar({
    q,
    onQ,
    status,
    onStatus,
    filtros,
    onFiltros,
    shown,
    total,
}: {
    q: string;
    onQ: (v: string) => void;
    status: string;
    onStatus: (v: string) => void;
    filtros: NFFiltros;
    onFiltros: (f: NFFiltros) => void;
    shown: number;
    total?: number;
}): JSX.Element {
    const { t } = useTranslation();
    const searchRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState<NFFiltros>(filtros);
    const [open, setOpen] = useState(false);

    useEffect(() => setDraft(filtros), [filtros]);

    // Atalho "/" foca a busca (padrão de ferramentas de dados).
    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            const el = document.activeElement;
            const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
            if (e.key === '/' && !typing) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const chips = filtrosAtivos(filtros);
    const advCount = chips.filter(([k]) => k !== 'cnpjEmitente').length; // "extras" além do que já há inline

    function removerFiltro(campo: keyof NFFiltros): void {
        const resto = { ...filtros };
        delete resto[campo];
        onFiltros(resto);
    }
    const set = (campo: keyof NFFiltros) => (e: { target: { value: string } }) =>
        setDraft((d) => ({ ...d, [campo]: e.target.value }));

    function aplicarAvancados(): void {
        const limpo: NFFiltros = {};
        for (const [k, v] of Object.entries(draft)) if (v !== undefined && v !== '') limpo[k as keyof NFFiltros] = v;
        onFiltros(limpo);
        setOpen(false);
    }

    const field = (campo: keyof NFFiltros, labelKey: string, type = 'text', extra?: Record<string, unknown>): JSX.Element => (
        <div className="grid gap-1.5">
            <Label htmlFor={`fb-${campo}`} className="text-xs text-muted-foreground">{t(labelKey)}</Label>
            <Input id={`fb-${campo}`} type={type} value={(draft[campo] as string) ?? ''} onChange={set(campo)} className="h-8" {...extra} />
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        placeholder={t('nf.filtros.buscaUnica')}
                        value={q}
                        onChange={(e) => onQ(e.target.value)}
                        className="h-9 pl-8 pr-8"
                    />
                    <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:block">/</kbd>
                </div>

                <select value={status} onChange={(e) => onStatus(e.target.value)} data-testid="nf-status-filter" className={selectClass}>
                    <option value="">{t('nf.todosStatus')}</option>
                    <option value="ativa">{t('nf.statusAtiva')}</option>
                    <option value="cancelada">{t('nf.statusCancelada')}</option>
                    <option value="denegada">{t('nf.statusDenegada')}</option>
                    <option value="inutilizada">{t('nf.statusInutilizada')}</option>
                </select>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-9">
                            <SlidersHorizontal /> {t('nf.filtros.maisFiltros')}
                            {advCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1 tabular-nums">{advCount}</Badge>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80">
                        <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
                            <p className="text-sm font-medium">{t('nf.filtros.titulo')}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {field('numero', 'nf.filtros.numero')}
                                {field('serie', 'nf.filtros.serie')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {field('dataEmissaoInicio', 'nf.filtros.emissaoInicio', 'date')}
                                {field('dataEmissaoFim', 'nf.filtros.emissaoFim', 'date')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {field('valorTotalMin', 'nf.filtros.valorMin', 'number')}
                                {field('valorTotalMax', 'nf.filtros.valorMax', 'number')}
                            </div>
                            {field('cnpjEmitente', 'nf.filtros.cnpjEmitente')}
                            {field('cnpjDestinatario', 'nf.filtros.cnpjDestinatario')}
                            <div className="grid grid-cols-2 gap-2">
                                {field('cfop', 'nf.filtros.cfop')}
                                {field('ncm', 'nf.filtros.ncm')}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" size="sm" variant="ghost" onClick={() => { setDraft({}); onFiltros({}); setOpen(false); }}>{t('nf.filtros.limpar')}</Button>
                                <Button type="button" size="sm" onClick={aplicarAvancados}>{t('nf.filtros.aplicar')}</Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <ResultCount shown={shown} total={total} />
            </div>

            {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {chips.map(([campo, valor]) => (
                        <Badge key={campo} variant="secondary" className="gap-1 pr-1">
                            <span className="text-muted-foreground">{filtroLabel(t, campo)}{valor ? ':' : ''}</span> {valor}
                            <button
                                type="button"
                                onClick={() => removerFiltro(campo)}
                                aria-label={`${t('nf.filtros.remover')} ${filtroLabel(t, campo)}`}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    ))}
                    {chips.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onFiltros({})}>
                            {t('nf.filtros.limparTudo')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
