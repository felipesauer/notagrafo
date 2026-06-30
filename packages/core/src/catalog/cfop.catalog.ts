/**
 * Catálogo CFOP — popula descricao/tipo/natureza do nó CFOP (seção 1.5 do
 * 01 schema dados.md).
 *
 * O CFOP (Código Fiscal de Operações e Prestações) tem 4 dígitos. O 1º dígito
 * define o sentido e o âmbito da operação:
 *   1 = entrada interna (mesmo estado)        5 = saída interna
 *   2 = entrada interestadual                 6 = saída interestadual
 *   3 = entrada do exterior                   7 = saída para o exterior
 * Logo `tipo` (entrada|saida) e `natureza` (interna|interestadual|exterior) são
 * deriváveis do 1º dígito mesmo para um CFOP fora da tabela de descrições.
 *
 * Estático e versionado no repositório — sem fetch em runtime (mesma regra dos XSDs).
 */

import type { CFOPNode } from '../types/nf.types.js';

/** tipo + natureza, presentes mesmo quando a descrição é desconhecida. */
export type CfopInfo = Pick<CFOPNode, 'tipo' | 'natureza'> & { descricao?: string };

/**
 * Descrições dos CFOPs mais frequentes em NF-e (incluindo os usados no seed:
 * 5101, 5102). A chave é o código de 4 dígitos. tipo/natureza NÃO ficam aqui —
 * são sempre derivados do 1º dígito (ver deriveTipoNatureza), garantindo
 * consistência inclusive para os códigos não listados.
 */
const DESCRICOES: Readonly<Record<string, string>> = {
    // Entradas internas (1xxx)
    '1101': 'Compra para industrialização',
    '1102': 'Compra para comercialização',
    '1111': 'Compra para industrialização de mercadoria recebida de terceiros',
    '1201': 'Devolução de venda de produção do estabelecimento',
    '1202': 'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
    '1403': 'Compra para comercialização em operação com ST',
    '1556': 'Compra de material para uso ou consumo',
    // Entradas interestaduais (2xxx)
    '2101': 'Compra para industrialização (interestadual)',
    '2102': 'Compra para comercialização (interestadual)',
    '2202': 'Devolução de venda de mercadoria adquirida ou recebida de terceiros (interestadual)',
    '2403': 'Compra para comercialização em operação com ST (interestadual)',
    // Entradas do exterior (3xxx)
    '3101': 'Compra para industrialização (importação)',
    '3102': 'Compra para comercialização (importação)',
    // Saídas internas (5xxx)
    '5101': 'Venda de produção do estabelecimento',
    '5102': 'Venda de mercadoria adquirida ou recebida de terceiros',
    '5103': 'Venda de produção do estabelecimento, fora do estabelecimento',
    '5201': 'Devolução de compra para industrialização',
    '5202': 'Devolução de compra para comercialização',
    '5403': 'Venda de mercadoria com ST, na condição de contribuinte substituto',
    '5405': 'Venda de mercadoria com ST, na condição de contribuinte substituído',
    '5910': 'Remessa em bonificação, doação ou brinde',
    '5949': 'Outra saída de mercadoria ou prestação de serviço não especificada',
    // Saídas interestaduais (6xxx)
    '6101': 'Venda de produção do estabelecimento (interestadual)',
    '6102': 'Venda de mercadoria adquirida ou recebida de terceiros (interestadual)',
    '6202': 'Devolução de compra para comercialização (interestadual)',
    '6403': 'Venda de mercadoria com ST, contribuinte substituto (interestadual)',
    '6949': 'Outra saída de mercadoria ou prestação de serviço não especificada (interestadual)',
    // Saídas para o exterior (7xxx)
    '7101': 'Venda de produção do estabelecimento (exportação)',
    '7102': 'Venda de mercadoria adquirida ou recebida de terceiros (exportação)',
};

/** Mantém só os dígitos do código (o XML pode trazer pontuação ou espaços). */
function onlyDigits(codigo: string): string {
    return codigo.replace(/\D/g, '');
}

/** Deriva tipo (entrada|saida) e natureza (interna|interestadual|exterior) do 1º dígito. */
function deriveTipoNatureza(primeiroDigito: string): Pick<CFOPNode, 'tipo' | 'natureza'> {
    switch (primeiroDigito) {
        case '1':
            return { tipo: 'entrada', natureza: 'interna' };
        case '2':
            return { tipo: 'entrada', natureza: 'interestadual' };
        case '3':
            return { tipo: 'entrada', natureza: 'exterior' };
        case '5':
            return { tipo: 'saida', natureza: 'interna' };
        case '6':
            return { tipo: 'saida', natureza: 'interestadual' };
        case '7':
            return { tipo: 'saida', natureza: 'exterior' };
        default:
            return {};
    }
}

/**
 * Resolve descrição, tipo e natureza de um CFOP.
 *
 * `tipo`/`natureza` são sempre derivados do 1º dígito (presentes mesmo para CFOP
 * fora da tabela de descrições); `descricao` só vem quando o código está em DESCRICOES.
 * Código sem 1º dígito reconhecível (1/2/3/5/6/7) retorna `{}`.
 */
export function lookupCfop(codigo: string): CfopInfo {
    const digits = onlyDigits(codigo);
    const base = deriveTipoNatureza(digits.charAt(0));
    const descricao = DESCRICOES[digits];
    return { ...base, ...(descricao ? { descricao } : {}) };
}
