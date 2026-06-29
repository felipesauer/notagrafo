import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

/**
 * Sidebar com os ~13 filtros do GET /nf. Mantém um rascunho local e só
 * propaga via onAplicar (botão Aplicar) — evita refetch a cada tecla.
 */
export function FilterSidebar({ valor, onAplicar }: FilterSidebarProps): JSX.Element {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<NFFiltros>(valor);

    const set = (campo: keyof NFFiltros) => (e: { target: { value: string } }) =>
        setDraft((d) => ({ ...d, [campo]: e.target.value }));

    function aplicar(): void {
        onAplicar(limparVazios(draft));
    }
    function limpar(): void {
        setDraft({});
        onAplicar({});
    }

    return (
        <aside className="filter-sidebar">
            <h3>{t('nf.filtros.titulo')}</h3>

            <label>
                {t('nf.filtros.numero')}
                <input value={draft.numero ?? ''} onChange={set('numero')} />
            </label>
            <label>
                {t('nf.filtros.serie')}
                <input value={draft.serie ?? ''} onChange={set('serie')} />
            </label>

            <label>
                {t('nf.filtros.emissaoInicio')}
                <input type="date" value={draft.dataEmissaoInicio ?? ''} onChange={set('dataEmissaoInicio')} />
            </label>
            <label>
                {t('nf.filtros.emissaoFim')}
                <input type="date" value={draft.dataEmissaoFim ?? ''} onChange={set('dataEmissaoFim')} />
            </label>

            <label>
                {t('nf.filtros.valorMin')}
                <input type="number" value={draft.valorTotalMin ?? ''} onChange={set('valorTotalMin')} />
            </label>
            <label>
                {t('nf.filtros.valorMax')}
                <input type="number" value={draft.valorTotalMax ?? ''} onChange={set('valorTotalMax')} />
            </label>

            <label>
                {t('nf.filtros.tipoNF')}
                <select value={draft.tipoNF ?? ''} onChange={set('tipoNF')}>
                    <option value="">{t('nf.filtros.todos')}</option>
                    <option value="entrada">{t('nf.filtros.tipoEntrada')}</option>
                    <option value="saida">{t('nf.filtros.tipoSaida')}</option>
                </select>
            </label>
            <label>
                {t('nf.filtros.finalidade')}
                <select value={draft.finalidade ?? ''} onChange={set('finalidade')}>
                    <option value="">{t('nf.filtros.todos')}</option>
                    <option value="normal">{t('nf.filtros.finNormal')}</option>
                    <option value="complementar">{t('nf.filtros.finComplementar')}</option>
                    <option value="ajuste">{t('nf.filtros.finAjuste')}</option>
                    <option value="devolucao">{t('nf.filtros.finDevolucao')}</option>
                </select>
            </label>

            <label>
                {t('nf.filtros.naturezaOp')}
                <input value={draft.naturezaOp ?? ''} onChange={set('naturezaOp')} />
            </label>

            <label>
                {t('nf.filtros.cnpjEmitente')}
                <input value={draft.cnpjEmitente ?? ''} onChange={set('cnpjEmitente')} />
            </label>
            <label>
                {t('nf.filtros.ufEmitente')}
                <input maxLength={2} value={draft.ufEmitente ?? ''} onChange={set('ufEmitente')} />
            </label>
            <label>
                {t('nf.filtros.cnpjDestinatario')}
                <input value={draft.cnpjDestinatario ?? ''} onChange={set('cnpjDestinatario')} />
            </label>
            <label>
                {t('nf.filtros.ufDestinatario')}
                <input maxLength={2} value={draft.ufDestinatario ?? ''} onChange={set('ufDestinatario')} />
            </label>

            <label>
                {t('nf.filtros.cfop')}
                <input value={draft.cfop ?? ''} onChange={set('cfop')} />
            </label>
            <label>
                {t('nf.filtros.ncm')}
                <input value={draft.ncm ?? ''} onChange={set('ncm')} />
            </label>

            <div className="filter-sidebar__actions">
                <button type="button" onClick={aplicar}>{t('nf.filtros.aplicar')}</button>
                <button type="button" className="secondary" onClick={limpar}>{t('nf.filtros.limpar')}</button>
            </div>
        </aside>
    );
}
