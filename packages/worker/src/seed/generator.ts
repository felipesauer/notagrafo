/**
 * Gerador de NFes fictícias v4.00 válidas contra o XSD, para o seed de demo.
 * Gera impostos realistas (ICMS por CST, IPI/PIS/COFINS, alguns com ICMS-ST/FCP),
 * múltiplos itens por NF e variação de CFOP/NCM. Suporta NF de devolução
 * (finNFe=4 + NFref/refNFe). Mantém a estrutura/grupos obrigatórios do leiaute,
 * incluindo um bloco Signature estrutural (placeholder, o XSD valida só a forma).
 */

export interface EmpresaFicticia {
    cnpj: string;
    nome: string;
    uf: string;
    municipio: string;
    codMunicipio: string;
}

export interface ProdutoFicticio {
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    valorUnitario: number;
    /** Alíquota de ICMS (%) usada quando a NF é do regime normal. */
    aliqICMS: number;
    /** true → item com ICMS-ST + FCP (grupo ICMS10). */
    comST?: boolean;
}

const EMPRESAS: EmpresaFicticia[] = [
    { cnpj: '14200166000187', nome: 'Industria Alpha LTDA', uf: 'SP', municipio: 'Sao Paulo', codMunicipio: '3550308' },
    { cnpj: '11444777000161', nome: 'Distribuidora Beta SA', uf: 'MG', municipio: 'Belo Horizonte', codMunicipio: '3106200' },
    { cnpj: '33000167000101', nome: 'Comercio Gamma ME', uf: 'RJ', municipio: 'Rio de Janeiro', codMunicipio: '3304557' },
    { cnpj: '47960950000121', nome: 'Atacado Delta LTDA', uf: 'PR', municipio: 'Curitiba', codMunicipio: '4106902' },
    { cnpj: '60746948000112', nome: 'Varejo Epsilon SA', uf: 'RS', municipio: 'Porto Alegre', codMunicipio: '4314902' },
];

const PRODUTOS: ProdutoFicticio[] = [
    { codigo: 'NB001', descricao: 'Notebook 15 polegadas', ncm: '84713012', cfop: '5102', valorUnitario: 3500, aliqICMS: 18 },
    { codigo: 'MN002', descricao: 'Monitor LED 24', ncm: '85285200', cfop: '5102', valorUnitario: 900, aliqICMS: 18, comST: true },
    { codigo: 'TC003', descricao: 'Teclado mecanico', ncm: '84716053', cfop: '5102', valorUnitario: 250, aliqICMS: 12 },
    { codigo: 'CM004', descricao: 'Camiseta algodao', ncm: '61091000', cfop: '5101', valorUnitario: 45, aliqICMS: 12 },
    { codigo: 'CD005', descricao: 'Cadeira de escritorio', ncm: '94013000', cfop: '5102', valorUnitario: 650, aliqICMS: 18 },
    { codigo: 'GL006', descricao: 'Geladeira frost free', ncm: '84182100', cfop: '5102', valorUnitario: 2800, aliqICMS: 18, comST: true },
    { codigo: 'PN007', descricao: 'Pneu aro 15', ncm: '40111000', cfop: '5102', valorUnitario: 420, aliqICMS: 12, comST: true },
    { codigo: 'CF008', descricao: 'Cafe torrado 1kg', ncm: '09012100', cfop: '5101', valorUnitario: 38, aliqICMS: 7 },
];

function pick<T>(arr: T[], rng: () => number): T {
    return arr[Math.floor(rng() * arr.length)]!;
}

function pad(n: number, len: number): string {
    return String(n).padStart(len, '0');
}

function fmt(v: number): string {
    return v.toFixed(2);
}

/** Gera uma chave de acesso de 44 dígitos (estrutura simplificada, válida para o XSD). */
function generateAccessKey(seq: number, rng: () => number): string {
    const base = `352006${pad(Math.floor(rng() * 1e8), 8)}550010000${pad(seq, 6)}`;
    const resto = pad(Math.floor(rng() * 1e9), 9);
    return (base + resto).slice(0, 44).padEnd(44, '0');
}

/** PRNG determinístico (mulberry32) para seeds reproduzíveis. */
export function makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Tributos calculados de um item (regime normal). */
interface ItemTaxes {
    vProd: number;
    vICMS: number;
    vBC: number;
    vICMSST: number;
    vBCST: number;
    vFCP: number;
    vIPI: number;
    vPIS: number;
    vCOFINS: number;
}

const PIS = 0.0165;
const COFINS = 0.076;
const IPI = 0.05;
const FCP = 0.02;
const MVA_ST = 0.4;

/** Calcula os tributos de um item do regime normal a partir do produto e quantidade. */
function calcTaxes(prod: ProdutoFicticio, qtd: number): ItemTaxes {
    const vProd = round2(prod.valorUnitario * qtd);
    const aliq = prod.aliqICMS / 100;
    const vICMS = round2(vProd * aliq);
    const vIPI = round2(vProd * IPI);
    const vPIS = round2(vProd * PIS);
    const vCOFINS = round2(vProd * COFINS);
    let vBCST = 0;
    let vICMSST = 0;
    let vFCP = 0;
    if (prod.comST) {
        vBCST = round2(vProd * (1 + MVA_ST));
        vICMSST = round2(Math.max(0, vBCST * aliq - vICMS));
        vFCP = round2(vProd * FCP);
    }
    return { vProd, vICMS, vBC: vProd, vICMSST, vBCST, vFCP, vIPI, vPIS, vCOFINS };
}

function round2(v: number): number {
    return Math.round(v * 100) / 100;
}

/** Bloco <imposto> do item (regime normal): ICMS00 ou ICMS10 (com ST/FCP) + IPI/PIS/COFINS. */
function impostoXml(prod: ProdutoFicticio, tx: ItemTaxes): string {
    const icms = prod.comST
        ? `        <ICMS10>
          <orig>0</orig>
          <CST>10</CST>
          <modBC>3</modBC>
          <vBC>${fmt(tx.vBC)}</vBC>
          <pICMS>${fmt(prod.aliqICMS)}</pICMS>
          <vICMS>${fmt(tx.vICMS)}</vICMS>
          <vBCFCP>${fmt(tx.vBC)}</vBCFCP>
          <pFCP>${fmt(FCP * 100)}</pFCP>
          <vFCP>${fmt(tx.vFCP)}</vFCP>
          <modBCST>4</modBCST>
          <pMVAST>${fmt(MVA_ST * 100)}</pMVAST>
          <vBCST>${fmt(tx.vBCST)}</vBCST>
          <pICMSST>${fmt(prod.aliqICMS)}</pICMSST>
          <vICMSST>${fmt(tx.vICMSST)}</vICMSST>
        </ICMS10>`
        : `        <ICMS00>
          <orig>0</orig>
          <CST>00</CST>
          <modBC>3</modBC>
          <vBC>${fmt(tx.vBC)}</vBC>
          <pICMS>${fmt(prod.aliqICMS)}</pICMS>
          <vICMS>${fmt(tx.vICMS)}</vICMS>
        </ICMS00>`;
    return `      <imposto>
        <ICMS>
${icms}
        </ICMS>
        <IPI>
          <cEnq>999</cEnq>
          <IPITrib>
            <CST>50</CST>
            <vBC>${fmt(tx.vBC)}</vBC>
            <pIPI>${fmt(IPI * 100)}</pIPI>
            <vIPI>${fmt(tx.vIPI)}</vIPI>
          </IPITrib>
        </IPI>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>${fmt(tx.vBC)}</vBC>
            <pPIS>${fmt(PIS * 100)}</pPIS>
            <vPIS>${fmt(tx.vPIS)}</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>${fmt(tx.vBC)}</vBC>
            <pCOFINS>${fmt(COFINS * 100)}</pCOFINS>
            <vCOFINS>${fmt(tx.vCOFINS)}</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>`;
}

/** Bloco <det> de um item. */
function detXml(nItem: number, prod: ProdutoFicticio, qtd: number, tx: ItemTaxes, cfop: string): string {
    return `    <det nItem="${nItem}">
      <prod>
        <cProd>${prod.codigo}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${prod.descricao}</xProd>
        <NCM>${prod.ncm}</NCM>
        <CFOP>${cfop}</CFOP>
        <uCom>UN</uCom>
        <qCom>${qtd}.0000</qCom>
        <vUnCom>${prod.valorUnitario.toFixed(10)}</vUnCom>
        <vProd>${fmt(tx.vProd)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${qtd}.0000</qTrib>
        <vUnTrib>${prod.valorUnitario.toFixed(10)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
${impostoXml(prod, tx)}
    </det>`;
}

export interface GeneratedNFe {
    chaveAcesso: string;
    xml: string;
    valorTotal: number;
}

export interface GenerateOptions {
    /** Quando presente, gera uma NF de devolução (finNFe=4) referenciando esta chave. */
    devolucaoRef?: string;
}

/**
 * Gera uma NFe fictícia. `seq` indexa a nota; `rng` controla a aleatoriedade.
 * Por padrão emite uma venda (regime normal, impostos != 0) com 1–3 itens.
 * Com `opts.devolucaoRef`, emite uma devolução (finNFe=4, tpNF=0) com NFref.
 */
export function generateNFe(seq: number, rng: () => number = makeRng(seq), opts: GenerateOptions = {}): GeneratedNFe {
    const accessKey = generateAccessKey(seq, rng);
    const emit = pick(EMPRESAS, rng);
    let dest = pick(EMPRESAS, rng);
    while (dest.cnpj === emit.cnpj) dest = pick(EMPRESAS, rng);

    const ehDevolucao = !!opts.devolucaoRef;
    // Devolução tem 1 item; venda tem 1–3 itens.
    const numItens = ehDevolucao ? 1 : 1 + Math.floor(rng() * 3);

    const dets: string[] = [];
    const tot = { vProd: 0, vICMS: 0, vICMSST: 0, vFCP: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vBC: 0, vBCST: 0 };
    for (let n = 1; n <= numItens; n++) {
        const prod = pick(PRODUTOS, rng);
        const qtd = 1 + Math.floor(rng() * 10);
        const tx = calcTaxes(prod, qtd);
        // CFOP: devolução usa 1202 (entrada/devolução); venda usa o CFOP do produto.
        const cfop = ehDevolucao ? '1202' : prod.cfop;
        dets.push(detXml(n, prod, qtd, tx, cfop));
        tot.vProd += tx.vProd;
        tot.vICMS += tx.vICMS;
        tot.vICMSST += tx.vICMSST;
        tot.vFCP += tx.vFCP;
        tot.vIPI += tx.vIPI;
        tot.vPIS += tx.vPIS;
        tot.vCOFINS += tx.vCOFINS;
        tot.vBC += tx.vBC;
        tot.vBCST += tx.vBCST;
    }
    // vNF = produtos + IPI + ST + FCP (ICMS próprio é embutido no preço; PIS/COFINS não somam ao total).
    const vNF = round2(tot.vProd + tot.vIPI + tot.vICMSST + tot.vFCP);
    const data = new Date(2026, 0, 1 + Math.floor(rng() * 150), 10, 0, 0);
    const dhEmi = `${data.toISOString().slice(0, 19)}-03:00`;

    const nfRef = opts.devolucaoRef ? `      <NFref>\n        <refNFe>${opts.devolucaoRef}</refNFe>\n      </NFref>\n` : '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${accessKey}">
    <ide>
      <cUF>35</cUF>
      <cNF>${pad(Math.floor(rng() * 1e8), 8)}</cNF>
      <natOp>${ehDevolucao ? 'DEVOLUCAO' : 'VENDA'}</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>${seq}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>${ehDevolucao ? '0' : '1'}</tpNF>
      <idDest>${emit.uf === dest.uf ? '1' : '2'}</idDest>
      <cMunFG>${emit.codMunicipio}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>0</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>${ehDevolucao ? '4' : '1'}</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0</verProc>
${nfRef}    </ide>
    <emit>
      <CNPJ>${emit.cnpj}</CNPJ>
      <xNome>${emit.nome}</xNome>
      <enderEmit>
        <xLgr>Rua Comercial</xLgr>
        <nro>${100 + seq}</nro>
        <xBairro>Centro</xBairro>
        <cMun>${emit.codMunicipio}</cMun>
        <xMun>${emit.municipio}</xMun>
        <UF>${emit.uf}</UF>
        <CEP>01001000</CEP>
      </enderEmit>
      <IE>111111111111</IE>
      <CRT>3</CRT>
    </emit>
    <dest>
      <CNPJ>${dest.cnpj}</CNPJ>
      <xNome>${dest.nome}</xNome>
      <enderDest>
        <xLgr>Av Cliente</xLgr>
        <nro>${200 + seq}</nro>
        <xBairro>Bairro</xBairro>
        <cMun>${dest.codMunicipio}</cMun>
        <xMun>${dest.municipio}</xMun>
        <UF>${dest.uf}</UF>
        <CEP>02002000</CEP>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
${dets.join('\n')}
    <total>
      <ICMSTot>
        <vBC>${fmt(tot.vBC)}</vBC>
        <vICMS>${fmt(tot.vICMS)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>${fmt(tot.vFCP)}</vFCP>
        <vBCST>${fmt(tot.vBCST)}</vBCST>
        <vST>${fmt(tot.vICMSST)}</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${fmt(tot.vProd)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>${fmt(tot.vIPI)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${fmt(tot.vPIS)}</vPIS>
        <vCOFINS>${fmt(tot.vCOFINS)}</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${fmt(vNF)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>01</tPag>
        <vPag>${fmt(vNF)}</vPag>
      </detPag>
    </pag>
  </infNFe>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="#NFe${accessKey}">
        <Transforms>
          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
          <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        </Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <DigestValue>aGFzaC1wbGFjZWhvbGRlcg==</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>c2lnbmF0dXJlLXBsYWNlaG9sZGVy</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>Y2VydC1wbGFjZWhvbGRlcg==</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</NFe>`;

    return { chaveAcesso: accessKey, xml, valorTotal: vNF };
}
