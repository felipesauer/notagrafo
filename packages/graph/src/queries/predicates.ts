/**
 * Predicados de filtro compartilhados entre queries.
 *
 * Uma NotaFiscal é "ativa" (uma transação comercial real, contável em agregações)
 * quando tem `status` (não é um stub criado só como alvo de uma aresta DEVOLVE) e
 * não é uma devolução (`finalidade = 'devolucao'` inverte o fluxo, não soma como
 * transação nova). Este é o mesmo recorte de buildTaxWhere (tax.queries) — extraído
 * aqui para ser aplicado de forma CONSISTENTE em flow/alert/company/graph.metrics,
 * que antes divergiam entre si (NOTA-201).
 *
 * Exceção intencional: analysis.findNumberingGaps NÃO exclui devoluções — uma
 * devolução consome um número da sequência do emitente, então contá-la é o
 * correto para detectar buracos de numeração. Por isso essa query mantém apenas
 * `status IS NOT NULL` e não usa este predicado.
 *
 * @param nfVar nome da variável Cypher que referencia o nó :NotaFiscal (ex.: 'nf').
 * @returns predicado booleano para usar dentro de um WHERE.
 */
export function activeNFPredicate(nfVar = 'nf'): string {
    return `${nfVar}.status IS NOT NULL AND coalesce(${nfVar}.finalidade, '') <> 'devolucao'`;
}
