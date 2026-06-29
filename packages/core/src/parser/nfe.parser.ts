import { XMLParser } from 'fast-xml-parser';
import type {
    NotaFiscalNode,
    EmpresaNode,
    ProdutoNode,
    NCMNode,
    CFOPNode,
    ContemEdge,
    TotaisNF,
    NFTipo,
    NFFinalidade,
    RegimeTributario,
} from '../types/nf.types.js';
import { resolveUniqueId } from '../utils/product.utils.js';

/** Item da NF: o produto, sua classificação e os valores da aresta CONTÉM. */
export interface ParsedItem {
    produto: ProdutoNode;
    ncm: NCMNode;
    cfop: CFOPNode;
    contem: ContemEdge;
}

/** Resultado da extração de uma NFe: nós e arestas prontos para o grafo. */
export interface ParsedNF {
    nota: NotaFiscalNode;
    emitente: EmpresaNode;
    destinatario?: EmpresaNode;
    itens: ParsedItem[];
    /** Totais da NF (grupo total/ICMSTot). Base do bloco `totais` do detalhe e dos stats. */
    totais: TotaisNF;
    /** Chaves de NFes referenciadas (ide/NFref/refNFe). Base das arestas DEVOLVE/CANCELA. */
    referencias: string[];
}

/** Erro lançado quando o XML não tem a estrutura mínima de uma NFe. */
export class NFeParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NFeParseError';
    }
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Sempre tratar det como array, mesmo com 1 item.
    isArray: (name) => name === 'det',
    parseTagValue: false, // mantém tudo como string; convertemos explicitamente
    trimValues: true,
});

/** Inclui a chave no objeto apenas se o valor for definido e não-vazio (regra 6). */
function opt<T extends Record<string, unknown>, K extends string>(
    key: K,
    value: string | undefined,
    map?: (v: string) => unknown,
): T | Record<string, never> {
    if (value === undefined || value === null || value === '') return {};
    return { [key]: map ? map(value) : value } as unknown as T;
}

function asString(v: unknown): string | undefined {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s === '' ? undefined : s;
}

/** Normaliza um código EAN: o sentinela 'SEM GTIN' equivale a EAN ausente. */
function asEan(v: unknown): string | undefined {
    const s = asString(v);
    return s !== undefined && s.toUpperCase() !== 'SEM GTIN' ? s : undefined;
}

function mapTipoNF(tpNF: string | undefined): NFTipo {
    return tpNF === '0' ? 'entrada' : 'saida';
}

function mapFinalidade(finNFe: string | undefined): NFFinalidade {
    switch (finNFe) {
        case '2':
            return 'complementar';
        case '3':
            return 'ajuste';
        case '4':
            return 'devolucao';
        default:
            return 'normal';
    }
}

function mapRegime(crt: string | undefined): RegimeTributario | undefined {
    switch (crt) {
        case '1':
            return 'simples';
        case '2':
            return 'simplesExcesso';
        case '3':
            return 'normal';
        default:
            return undefined;
    }
}

/** Extrai os 44 dígitos da chave de acesso do atributo Id (formato "NFe<44 dígitos>"). */
function extractAccessKey(id: string | undefined): string {
    if (!id) throw new NFeParseError('infNFe/@Id ausente — sem chave de acesso.');
    return id.replace(/^NFe/, '');
}

type XmlObj = Record<string, unknown>;

function isObj(v: unknown): v is XmlObj {
    return typeof v === 'object' && v !== null;
}

/**
 * Procura recursivamente a primeira ocorrência de uma tag numérica dentro de um
 * grupo de tributo (ex.: IPI → IPITrib → vIPI). Retorna o número ou undefined.
 */
function findTaxValue(node: unknown, tag: string): number | undefined {
    if (!isObj(node)) return undefined;
    const direct = asString(node[tag]);
    if (direct !== undefined) return Number(direct);
    for (const v of Object.values(node)) {
        if (isObj(v)) {
            const found = findTaxValue(v, tag);
            if (found !== undefined) return found;
        }
    }
    return undefined;
}

/** Soma os tributos de um item a partir dos grupos presentes (regra 8: só XSD vigente). */
function extractTaxes(imposto: unknown): Partial<ContemEdge> {
    if (!isObj(imposto)) return {};
    const out: Partial<ContemEdge> = {};

    // ICMS: o grupo tem uma subchave variável (ICMS00, ICMSSN102, ...).
    const icmsGroup = imposto.ICMS;
    if (isObj(icmsGroup)) {
        const icms = Object.values(icmsGroup).find(isObj);
        if (icms) {
            // CST (regime normal) ou CSOSN (Simples Nacional) — string p/ preservar zeros.
            const cst = asString(icms.CST) ?? asString(icms.CSOSN);
            const vICMS = asString(icms.vICMS);
            const vBC = asString(icms.vBC);
            const pICMS = asString(icms.pICMS);
            const vBCST = asString(icms.vBCST);
            const vICMSST = asString(icms.vICMSST);
            const vFCP = asString(icms.vFCP);
            const vICMSDeson = asString(icms.vICMSDeson);
            if (cst !== undefined) out.cst = cst;
            if (vICMS !== undefined) out.vICMS = Number(vICMS);
            if (vBC !== undefined) out.vBCICMS = Number(vBC);
            if (pICMS !== undefined) out.pICMS = Number(pICMS);
            if (vBCST !== undefined) out.vBCST = Number(vBCST);
            if (vICMSST !== undefined) out.vICMSST = Number(vICMSST);
            if (vFCP !== undefined) out.vFCP = Number(vFCP);
            if (vICMSDeson !== undefined) out.vICMSDeson = Number(vICMSDeson);
        }
    }

    const groups: Array<[keyof ContemEdge, string, string]> = [
        ['vIPI', 'IPI', 'vIPI'],
        ['vPIS', 'PIS', 'vPIS'],
        ['vCOFINS', 'COFINS', 'vCOFINS'],
        ['vII', 'II', 'vII'],
        ['vISSQN', 'ISSQN', 'vISSQN'],
    ];
    for (const [field, group, tag] of groups) {
        const val = findTaxValue(imposto[group], tag);
        if (val !== undefined) (out[field] as number) = val;
    }
    return out;
}

/**
 * Extrai os totais da NF do grupo total/ICMSTot. Só inclui campos presentes
 * (sem propriedade null/undefined, regra 6). Mapeia vBC→vBC e vST→vST etc.
 */
function extractTotals(icmsTot: unknown): TotaisNF {
    if (!isObj(icmsTot)) return {};
    const out: TotaisNF = {};
    const fields: Array<keyof TotaisNF> = [
        'vNF', 'vProd', 'vBC', 'vICMS', 'vICMSDeson', 'vFCP', 'vBCST', 'vST',
        'vIPI', 'vPIS', 'vCOFINS', 'vII', 'vFrete', 'vSeg', 'vDesc', 'vOutro',
    ];
    for (const f of fields) {
        const v = asString(icmsTot[f]);
        if (v !== undefined) out[f] = Number(v);
    }
    return out;
}

/**
 * Extrai as chaves de NFes referenciadas do grupo ide/NFref/refNFe.
 * NFref pode ser objeto único ou array (maxOccurs=999 no XSD); cada um pode ter
 * refNFe (chave de 44 dígitos) ou outras formas (refNF, refCTe, ...) — só refNFe
 * é uma chave de acesso direta, base de DEVOLVE/CANCELA. Retorna [] quando ausente.
 */
function extractReferences(ide: XmlObj): string[] {
    const nfRefRaw = ide.NFref;
    if (nfRefRaw === undefined || nfRefRaw === null) return [];
    const list = Array.isArray(nfRefRaw) ? nfRefRaw : [nfRefRaw];
    const refs: string[] = [];
    for (const ref of list) {
        if (!isObj(ref)) continue;
        const chave = asString(ref.refNFe) ?? asString(ref.refNFeSig);
        if (chave !== undefined) refs.push(chave);
    }
    return refs;
}

/**
 * Extrai uma NFe v4.00 (XML) para os tipos do core. O XSD é a fonte de verdade
 * dos campos; campos ausentes NÃO viram null/undefined no objeto (regra 6 da
 * seção 6 do 01 schema dados.md) — simplesmente não existem como chave.
 *
 * `status`, `importadaEm` e `processadaEm` são internos (não vêm do XML) —
 * o chamador os define; o parser assume status 'ativa' e importadaEm = importadoEm.
 *
 * @throws {NFeParseError} se o XML não tiver estrutura de NFe.
 */
export function parseNFe(xml: string, importadoEm: Date): ParsedNF {
    const root = parser.parse(xml) as XmlObj;
    const proc = isObj(root.nfeProc) ? root.nfeProc : undefined;
    const nfe = isObj(root.NFe) ? root.NFe : isObj(proc?.NFe) ? proc.NFe : undefined;
    const infNFe = isObj(nfe?.infNFe) ? nfe.infNFe : undefined;
    if (!infNFe) throw new NFeParseError('Estrutura infNFe não encontrada no XML.');

    const ide = isObj(infNFe.ide) ? infNFe.ide : {};
    const emit = isObj(infNFe.emit) ? infNFe.emit : {};
    const dest = isObj(infNFe.dest) ? infNFe.dest : undefined;
    const totalNode = isObj(infNFe.total) ? infNFe.total : undefined;
    const total = isObj(totalNode?.ICMSTot) ? totalNode.ICMSTot : {};
    const infAdic = isObj(infNFe.infAdic) ? infNFe.infAdic : undefined;

    const chaveAcesso = extractAccessKey(asString(infNFe['@_Id']));
    const cnpjEmit = asString(emit.CNPJ) ?? '';

    const nota: NotaFiscalNode = {
        chaveAcesso,
        numero: asString(ide.nNF) ?? '',
        serie: asString(ide.serie) ?? '',
        dataEmissao: new Date(asString(ide.dhEmi) ?? importadoEm.toISOString()),
        dataSaida: new Date(asString(ide.dhSaiEnt) ?? asString(ide.dhEmi) ?? importadoEm.toISOString()),
        valorTotal: Number(asString(total.vNF) ?? '0'),
        status: 'ativa',
        tipoNF: mapTipoNF(asString(ide.tpNF)),
        finalidade: mapFinalidade(asString(ide.finNFe)),
        importadaEm: importadoEm,
        ...opt('naturezaOp', asString(ide.natOp)),
        ...opt('indFinal', asString(ide.indFinal), (v) => v === '1'),
        ...opt('indPres', asString(ide.indPres)),
        ...opt('infCpl', asString(infAdic?.infCpl)),
        ...opt('infAdFisco', asString(infAdic?.infAdFisco)),
    };

    const emitente = parseCompany(emit, true);
    const destinatario = dest ? parseCompany(dest, false) : undefined;

    const detList = Array.isArray(infNFe.det) ? (infNFe.det as XmlObj[]) : [];
    const itens: ParsedItem[] = detList.map((det) => parseItem(det, cnpjEmit));

    return {
        nota,
        emitente,
        ...(destinatario ? { destinatario } : {}),
        itens,
        totais: extractTotals(total),
        referencias: extractReferences(ide),
    };
}

function parseCompany(node: XmlObj, isEmit: boolean): EmpresaNode {
    const enderRaw = node.enderEmit ?? node.enderDest;
    const ender = isObj(enderRaw) ? enderRaw : {};
    const regime = isEmit ? mapRegime(asString(node.CRT)) : undefined;
    return {
        cnpj: asString(node.CNPJ) ?? asString(node.CPF) ?? '',
        razaoSocial: asString(node.xNome) ?? '',
        uf: asString(ender.UF) ?? '',
        municipio: asString(ender.xMun) ?? '',
        ...opt('nomeFantasia', asString(node.xFant)),
        ...opt('cep', asString(ender.CEP)),
        ...opt('logradouro', asString(ender.xLgr)),
        ...opt('numero', asString(ender.nro)),
        ...opt('ie', asString(node.IE)),
        ...opt('im', asString(node.IM)),
        ...opt('cnae', asString(node.CNAE)),
        ...(regime ? { regimeTributario: regime } : {}),
    };
}

function parseItem(det: XmlObj, cnpjEmit: string): ParsedItem {
    const prod = isObj(det.prod) ? det.prod : {};
    const imposto = det.imposto;
    const numeroItem = Number(asString(det['@_nItem']) ?? '0');

    const codigo = asString(prod.cProd) ?? '';
    const ean = asEan(prod.cEAN);
    const idUnico = resolveUniqueId({ codigo, cnpjEmitente: cnpjEmit, ...(ean ? { ean } : {}) });

    const produto: ProdutoNode = {
        idUnico,
        codigo,
        descricao: asString(prod.xProd) ?? '',
        cnpjEmitente: cnpjEmit,
        ...opt('ean', ean),
        ...opt('eanTrib', asEan(prod.cEANTrib)),
        ...opt('unidade', asString(prod.uCom)),
        ...opt('unidadeTrib', asString(prod.uTrib)),
        ...opt('extipi', asString(prod.EXTIPI)),
    };

    const ncm: NCMNode = {
        codigo: asString(prod.NCM) ?? '',
        ...opt('capitulo', asString(prod.NCM)?.slice(0, 2)),
    };

    const cfop: CFOPNode = { codigo: asString(prod.CFOP) ?? '' };

    const contem: ContemEdge = {
        numeroItem,
        quantidade: Number(asString(prod.qCom) ?? '0'),
        valorUnitario: Number(asString(prod.vUnCom) ?? '0'),
        valorTotal: Number(asString(prod.vProd) ?? '0'),
        ...opt('desconto', asString(prod.vDesc), Number),
        ...opt('cest', asString(prod.CEST)),
        ...extractTaxes(imposto),
    };

    return { produto, ncm, cfop, contem };
}
