export type NFStatus = 'ativa' | 'cancelada' | 'denegada' | 'inutilizada';
export type NFTipo = 'entrada' | 'saida';
export type NFFinalidade = 'normal' | 'complementar' | 'ajuste' | 'devolucao';
export type RegimeTributario = 'simples' | 'simplesExcesso' | 'normal';
export type EventoTipo =
    | 'importada'
    | 'processada'
    | 'cancelada'
    | 'consultada'
    | 'exportada'
    | 'erro';

export interface NotaFiscalNode {
    chaveAcesso: string;
    numero: string;
    serie: string;
    dataEmissao: Date;
    dataSaida: Date;
    valorTotal: number;
    status: NFStatus;
    tipoNF: NFTipo;
    finalidade: NFFinalidade;
    importadaEm: Date;
    processadaEm?: Date;
    naturezaOp?: string;
    indFinal?: boolean;
    indPres?: string;
    infCpl?: string;
    infAdFisco?: string;
}

export interface EmpresaNode {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    uf: string;
    municipio: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    ie?: string;
    im?: string;
    cnae?: string;
    regimeTributario?: RegimeTributario;
}

export interface ProdutoNode {
    idUnico: string;       // EAN se disponível, senão `${codigo}::${cnpjEmitente}`
    codigo: string;
    descricao: string;
    cnpjEmitente: string;
    ean?: string;
    eanTrib?: string;
    unidade?: string;
    unidadeTrib?: string;
    extipi?: string;
}

export interface NCMNode {
    codigo: string;
    descricao?: string;
    secao?: string;
    capitulo?: string;
}

export interface CFOPNode {
    codigo: string;
    descricao?: string;
    tipo?: 'entrada' | 'saida';
    natureza?: string;
}

export interface RawDataNode {
    xmlGzip: Buffer;
    jsonCompleto: string;
    checksum: string;
    tamanhoBytes: number;
    // String livre — ex: '3.10', '4.00', '4.01'.
    // Aceitar qualquer versão cujo XSD esteja presente em packages/core/src/schemas/xsd/
    versaoSchema: string;
}

export interface EventoNode {
    tipo: EventoTipo;
    timestamp: Date;
    autor?: string;
    detalhes?: string;
    ipOrigem?: string;
}

// Propriedades da aresta CONTÉM
// Valores extraídos dos grupos de tributos presentes no XSD NFe vigente,
// incluindo a Reforma Tributária (IBS/CBS/IS — grupo gIBSCBS, tipo TCIBS), que o
// leiaute v4.00 em disco já modela (NT 2025.002). Campos da reforma são
// opcionais: NF-e pré-reforma não trazem o grupo (ADR-18).
export interface ContemEdge {
    numeroItem: number;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    desconto?: number;
    // CST/CSOSN do ICMS do item (string — preserva zeros à esquerda; ex.: '00', '102').
    cst?: string;
    // CEST — Código Especificador da Substituição Tributária (det/prod/CEST).
    cest?: string;
    // CFOP do item (det/prod/CFOP). Copiado na aresta para agregação fiscal por
    // CFOP sem ambiguidade — uma NF pode ter itens com CFOPs distintos.
    cfop?: string;
    // ICMS — grupo det/imposto/ICMS (múltiplas CSTs possíveis no XSD)
    vICMS?: number;
    vBCICMS?: number;
    pICMS?: number;
    // ICMS-ST — substituição tributária (vBCST, vICMSST)
    vBCST?: number;
    vICMSST?: number;
    // FCP — Fundo de Combate à Pobreza (vFCP)
    vFCP?: number;
    // ICMS desonerado (vICMSDeson)
    vICMSDeson?: number;
    // IPI — grupo det/imposto/IPI
    vIPI?: number;
    // PIS — grupo det/imposto/PIS
    vPIS?: number;
    // COFINS — grupo det/imposto/COFINS
    vCOFINS?: number;
    // II — Imposto de Importação (det/imposto/II)
    vII?: number;
    // ISSQN — serviços (det/imposto/ISSQN)
    vISSQN?: number;
    // ── Reforma Tributária (grupo det/imposto/IBSCBS/gIBSCBS, tipo TCIBS) ──
    // CST e classificação tributária da reforma (distintos do CST do ICMS).
    cstIBSCBS?: string;
    cClassTrib?: string;
    // IBS — Imposto sobre Bens e Serviços (estadual + municipal). vIBS = soma UF+Mun.
    vBCIBSCBS?: number; // base de cálculo comum IBS/CBS
    vIBS?: number;
    vIBSUF?: number;
    pIBSUF?: number;
    vIBSMun?: number;
    pIBSMun?: number;
    // CBS — Contribuição sobre Bens e Serviços (federal; substitui PIS/COFINS).
    vCBS?: number;
    pCBS?: number;
    // IS — Imposto Seletivo (det/imposto/IS).
    vIS?: number;
    pIS?: number;
}

// Totais da NF — grupo total/ICMSTot. Espelham os campos somados do XSD vigente.
// Todos opcionais: campos ausentes no grupo não viram propriedade (regra 6).
export interface TotaisNF {
    vNF?: number;
    vProd?: number;
    vBC?: number;
    vICMS?: number;
    vICMSDeson?: number;
    vFCP?: number;
    vBCST?: number;
    vST?: number;
    vIPI?: number;
    vPIS?: number;
    vCOFINS?: number;
    vII?: number;
    vFrete?: number;
    vSeg?: number;
    vDesc?: number;
    vOutro?: number;
    // ── Reforma Tributária — totais (grupos total/IBSCBSTot e total/ISTot) ──
    // vIBS = total IBS (UF+Mun); vCBS = total CBS; vIS = total Imposto Seletivo.
    vBCIBSCBS?: number;
    vIBS?: number;
    vIBSUF?: number;
    vIBSMun?: number;
    vCBS?: number;
    vIS?: number;
}

// Propriedades da aresta CANCELA.
// A aresta CANCELA ainda NÃO é gravada (não há ingestão de evento de
// cancelamento da SEFAZ no fluxo atual — ADR-6); dataEvento/protocolo/motivo
// viriam desse evento, por isso todos são opcionais até a fonte existir.
export interface CancelaEdge {
    dataEvento?: Date;
    protocolo?: string;
    motivo?: string;
}

// Propriedades da aresta DEVOLVE.
// Gravada a partir de ide/NFref/refNFe (mergeInvoice grava apenas chaveRefNF).
// dataEvento é opcional: a origem da devolução é a NFref, que não carrega a
// data do evento — só seria preenchida com ingestão de eventos (ADR-6).
export interface DevolveEdge {
    dataEvento?: Date;
    chaveRefNF: string;
}
