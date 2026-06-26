import type { ProdutoNode } from '../types/nf.types.js';

/** Valor sentinela da SEFAZ para itens sem código de barras (GTIN). */
const SEM_GTIN = 'SEM GTIN';

/** Subconjunto de campos de Produto necessários para resolver a identidade única. */
export type ProdutoIdentidade = Pick<ProdutoNode, 'codigo' | 'cnpjEmitente' | 'ean'>;

/**
 * Resolve o `idUnico` de um produto (seção 1.3 do 01 schema dados.md).
 *
 * Estratégia, em ordem de prioridade:
 *  1. Se `ean` (GTIN) estiver presente e não for `SEM GTIN`, usa `ean`.
 *  2. Caso contrário, usa `${codigo}::${cnpjEmitente}`.
 *
 * Esta é a ÚNICA fonte da lógica de identidade do produto — não duplicar.
 */
export function resolveIdUnico(prod: ProdutoIdentidade): string {
    const ean = prod.ean?.trim();
    if (ean && ean.toUpperCase() !== SEM_GTIN) {
        return ean;
    }
    return `${prod.codigo}::${prod.cnpjEmitente}`;
}
