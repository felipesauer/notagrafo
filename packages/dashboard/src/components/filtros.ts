/** Filtros do GET /api/v1/nf (contrato §4). Consumidos pela NFFilterBar (barra no topo). */
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
    /** Filtro fiscal por deep-link (não editado na barra): NFs com ICMS recolhido. */
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

/** Filtros ativos como pares [campo, valor exibível], para renderizar chips.
 *  Booleanos (ex.: comImposto) retornam valor vazio — o chip mostra só o rótulo. */
export function filtrosAtivos(f: NFFiltros): [keyof NFFiltros, string][] {
    const out: [keyof NFFiltros, string][] = [];
    for (const [k, v] of Object.entries(f)) {
        if (v === undefined || v === '' || v === false) continue;
        out.push([k as keyof NFFiltros, v === true ? '' : String(v)]);
    }
    return out;
}
