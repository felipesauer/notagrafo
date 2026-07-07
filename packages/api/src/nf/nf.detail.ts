/**
 * Reformata o objeto cru de getInvoice (graph) para o contrato do
 * GET /api/v1/nf/:chave (.plan/02 §4 l.351-370): por item, os tributos vão
 * para um objeto `tributos` e o NCM é aninhado em `produto.ncm`; no topo,
 * os total_* da NF viram o bloco `totais`. Função pura — testável isolada.
 */

/** Campos da aresta CONTÉM que pertencem ao objeto `tributos` do item. */
const TRIBUTO_KEYS = [
    'vICMS', 'vBCICMS', 'pICMS', 'vBCST', 'vICMSST', 'vFCP', 'vICMSDeson',
    'vIPI', 'vPIS', 'vCOFINS', 'vII', 'vISSQN',
    // Reforma Tributária (EPIC-25): IBS/CBS/IS + classificação do item.
    'cstIBSCBS', 'cClassTrib', 'vBCIBSCBS',
    'vIBS', 'vIBSUF', 'pIBSUF', 'vIBSMun', 'pIBSMun', 'vCBS', 'pCBS', 'vIS', 'pIS',
] as const;

/** Demais campos da aresta CONTÉM que ficam no item (fora de `tributos`). */
const ITEM_KEYS = ['numeroItem', 'quantidade', 'valorUnitario', 'valorTotal', 'desconto', 'cst', 'cest'] as const;

type Dict = Record<string, unknown>;

interface RawItem {
    produto?: Dict;
    ncm?: Dict;
    [k: string]: unknown;
}

/** Move os total_* do nó NF para um objeto `totais` sem o prefixo (vICMS, vIPI, ...). */
function extractTotais(nf: Dict): { totais: Dict; rest: Dict } {
    const totais: Dict = {};
    const rest: Dict = {};
    for (const [k, v] of Object.entries(nf)) {
        if (k.startsWith('total_')) totais[k.slice('total_'.length)] = v;
        else rest[k] = v;
    }
    return { totais, rest };
}

/** Reagrupa um item: tributos separados e ncm aninhado no produto. */
function formatItem(item: RawItem): Dict {
    const out: Dict = {};
    for (const k of ITEM_KEYS) if (item[k] !== undefined) out[k] = item[k];

    const tributos: Dict = {};
    for (const k of TRIBUTO_KEYS) if (item[k] !== undefined) tributos[k] = item[k];
    out.tributos = tributos;

    // produto + ncm aninhado. Poda campos internos que não pertencem ao contrato
    // (.plan/02 §4): ncm reduzido a {codigo,descricao}; produto sem cnpjEmitente.
    if (item.produto) {
        const produto: Dict = { ...(item.produto as Dict) };
        delete produto.cnpjEmitente;
        if (item.ncm) {
            const ncm = item.ncm as Dict;
            produto.ncm = { codigo: ncm.codigo, ...(ncm.descricao ? { descricao: ncm.descricao } : {}) };
        }
        out.produto = produto;
    }
    return out;
}

/**
 * Detalhe da NF no formato do contrato. Recebe o retorno cru de getInvoice
 * (nf espalhada + itens[{...arestaCONTÉM, produto, ncm}] + cfop opcional).
 */
export function formatInvoiceDetail(raw: Record<string, unknown>): Record<string, unknown> {
    const { itens, cfop, ...nf } = raw as { itens?: RawItem[]; cfop?: Dict } & Dict;
    const { totais, rest } = extractTotais(nf);
    return {
        ...rest,
        ...(cfop ? { cfop: { codigo: cfop.codigo, ...(cfop.descricao ? { descricao: cfop.descricao } : {}) } } : {}),
        itens: (itens ?? []).map(formatItem),
        totais,
    };
}
