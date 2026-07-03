import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

/** Filtros do GET /api/v1/nf (contrato §4) expostos na sidebar. */
export interface NFFiltros {
    numero?: string;
    serie?: string;
    dataEmissaoInicio?: string;
    dataEmissaoFim?: string;
    valorTotalMin?: string;
    valorTotalMax?: string;
    tipoNF?: string;
    finalidade?: string;
    naturezaOp?: string;
    cnpjEmitente?: string;
    ufEmitente?: string;
    cnpjDestinatario?: string;
    ufDestinatario?: string;
    cfop?: string;
    ncm?: string;
    /** Filtro fiscal por deep-link (não editado na sidebar): NFs com ICMS recolhido. */
    comImposto?: boolean;
}

/** Rótulo i18n curto de cada filtro, para os chips. */
export function filtroLabel(t: (k: string) => string, campo: keyof NFFiltros): string {
    const map: Partial<Record<keyof NFFiltros, string>> = {
        numero: 'nf.filtros.numero', serie: 'nf.filtros.serie',
        dataEmissaoInicio: 'nf.filtros.emissaoInicio', dataEmissaoFim: 'nf.filtros.emissaoFim',
        valorTotalMin: 'nf.filtros.valorMin', valorTotalMax: 'nf.filtros.valorMax',
        tipoNF: 'nf.filtros.tipoNF', finalidade: 'nf.filtros.finalidade', naturezaOp: 'nf.filtros.naturezaOp',
        cnpjEmitente: 'nf.filtros.cnpjEmitente', ufEmitente: 'nf.filtros.ufEmitente',
        cnpjDestinatario: 'nf.filtros.cnpjDestinatario', ufDestinatario: 'nf.filtros.ufDestinatario',
        cfop: 'nf.filtros.cfop', ncm: 'nf.filtros.ncm', comImposto: 'nf.filtros.comImposto',
    };
    const key = map[campo];
    return key ? t(key) : campo;
}

/** Filtros ativos como pares [campo, valor exibível], para renderizar chips. */
export function filtrosAtivos(f: NFFiltros): [keyof NFFiltros, string][] {
    const out: [keyof NFFiltros, string][] = [];
    for (const [k, v] of Object.entries(f)) {
        if (v === undefined || v === '' || v === false) continue;
        out.push([k as keyof NFFiltros, v === true ? '✓' : String(v)]);
    }
    return out;
}

interface FilterSidebarProps {
    valor: NFFiltros;
    onAplicar: (filtros: NFFiltros) => void;
}

/** Remove chaves vazias para não poluir a query (filtrosAtivos do contrato). */
function limparVazios(f: NFFiltros): NFFiltros {
    const out: NFFiltros = {};
    for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '') out[k as keyof NFFiltros] = v;
    return out;
}

/** Estilo dos <select> nativos (ADR-10) alinhado ao Input do shadcn. */
const selectClass =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Sidebar de filtros do GET /nf, agrupados em acordeão (Identificação, Datas,
 * Valores, Partes, Itens fiscais). Mantém rascunho local e só propaga no botão
 * Aplicar (evita refetch a cada tecla). O contador de filtros ativos e os chips
 * ficam na página (NFList), a partir de `valor`.
 */
export function FilterSidebar({ valor, onAplicar }: FilterSidebarProps): JSX.Element {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<NFFiltros>(valor);

    // Re-semeia o rascunho quando os filtros externos mudam (deep-link na mesma rota).
    useEffect(() => {
        setDraft(valor);
    }, [valor]);

    const set = (campo: keyof NFFiltros) => (e: { target: { value: string } }) =>
        setDraft((d) => ({ ...d, [campo]: e.target.value }));

    function aplicar(): void {
        onAplicar(limparVazios(draft));
    }
    function limpar(): void {
        setDraft({});
        onAplicar({});
    }

    const field = (campo: keyof NFFiltros, labelKey: string, type = 'text', extra?: Record<string, unknown>): JSX.Element => (
        <div className="grid gap-1.5">
            <Label htmlFor={`f-${campo}`} className="text-xs text-muted-foreground">{t(labelKey)}</Label>
            <Input id={`f-${campo}`} type={type} value={(draft[campo] as string) ?? ''} onChange={set(campo)} className="h-9" {...extra} />
        </div>
    );

    return (
        <aside className="w-full">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('nf.filtros.titulo')}</h3>
            </div>
            <Accordion type="multiple" defaultValue={['ident', 'partes']} className="w-full">
                <AccordionItem value="ident">
                    <AccordionTrigger className="text-sm">{t('nf.filtros.grupoIdent')}</AccordionTrigger>
                    <AccordionContent className="grid gap-3">
                        {field('numero', 'nf.filtros.numero')}
                        {field('serie', 'nf.filtros.serie')}
                        <div className="grid gap-1.5">
                            <Label htmlFor="f-tipoNF" className="text-xs text-muted-foreground">{t('nf.filtros.tipoNF')}</Label>
                            <select id="f-tipoNF" className={selectClass} value={draft.tipoNF ?? ''} onChange={set('tipoNF')}>
                                <option value="">{t('nf.filtros.todos')}</option>
                                <option value="entrada">{t('nf.filtros.tipoEntrada')}</option>
                                <option value="saida">{t('nf.filtros.tipoSaida')}</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="f-finalidade" className="text-xs text-muted-foreground">{t('nf.filtros.finalidade')}</Label>
                            <select id="f-finalidade" className={selectClass} value={draft.finalidade ?? ''} onChange={set('finalidade')}>
                                <option value="">{t('nf.filtros.todos')}</option>
                                <option value="normal">{t('nf.filtros.finNormal')}</option>
                                <option value="complementar">{t('nf.filtros.finComplementar')}</option>
                                <option value="ajuste">{t('nf.filtros.finAjuste')}</option>
                                <option value="devolucao">{t('nf.filtros.finDevolucao')}</option>
                            </select>
                        </div>
                        {field('naturezaOp', 'nf.filtros.naturezaOp')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="datas">
                    <AccordionTrigger className="text-sm">{t('nf.filtros.grupoDatas')}</AccordionTrigger>
                    <AccordionContent className="grid gap-3">
                        {field('dataEmissaoInicio', 'nf.filtros.emissaoInicio', 'date')}
                        {field('dataEmissaoFim', 'nf.filtros.emissaoFim', 'date')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="valores">
                    <AccordionTrigger className="text-sm">{t('nf.filtros.grupoValores')}</AccordionTrigger>
                    <AccordionContent className="grid gap-3">
                        {field('valorTotalMin', 'nf.filtros.valorMin', 'number')}
                        {field('valorTotalMax', 'nf.filtros.valorMax', 'number')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="partes">
                    <AccordionTrigger className="text-sm">{t('nf.filtros.grupoPartes')}</AccordionTrigger>
                    <AccordionContent className="grid gap-3">
                        {field('cnpjEmitente', 'nf.filtros.cnpjEmitente')}
                        {field('ufEmitente', 'nf.filtros.ufEmitente', 'text', { maxLength: 2 })}
                        {field('cnpjDestinatario', 'nf.filtros.cnpjDestinatario')}
                        {field('ufDestinatario', 'nf.filtros.ufDestinatario', 'text', { maxLength: 2 })}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fiscais">
                    <AccordionTrigger className="text-sm">{t('nf.filtros.grupoFiscais')}</AccordionTrigger>
                    <AccordionContent className="grid gap-3">
                        {field('cfop', 'nf.filtros.cfop')}
                        {field('ncm', 'nf.filtros.ncm')}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="mt-4 flex gap-2">
                <Button type="button" size="sm" onClick={aplicar} className="flex-1">{t('nf.filtros.aplicar')}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={limpar}>{t('nf.filtros.limpar')}</Button>
            </div>
        </aside>
    );
}
