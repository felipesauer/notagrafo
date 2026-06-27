/**
 * Gerador de NFes fictícias v4.00 válidas contra o XSD, para o seed de demo.
 * Varia apenas campos seguros (chave, números, empresas, produto, valores) e
 * mantém a estrutura/grupos obrigatórios do leiaute — incluindo um bloco
 * Signature estrutural (placeholder, não criptográfico; o XSD valida só a forma).
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
}

const EMPRESAS: EmpresaFicticia[] = [
    { cnpj: '14200166000187', nome: 'Industria Alpha LTDA', uf: 'SP', municipio: 'Sao Paulo', codMunicipio: '3550308' },
    { cnpj: '11444777000161', nome: 'Distribuidora Beta SA', uf: 'MG', municipio: 'Belo Horizonte', codMunicipio: '3106200' },
    { cnpj: '33000167000101', nome: 'Comercio Gamma ME', uf: 'RJ', municipio: 'Rio de Janeiro', codMunicipio: '3304557' },
    { cnpj: '47960950000121', nome: 'Atacado Delta LTDA', uf: 'PR', municipio: 'Curitiba', codMunicipio: '4106902' },
    { cnpj: '60746948000112', nome: 'Varejo Epsilon SA', uf: 'RS', municipio: 'Porto Alegre', codMunicipio: '4314902' },
];

const PRODUTOS: ProdutoFicticio[] = [
    { codigo: 'NB001', descricao: 'Notebook 15 polegadas', ncm: '84713012', cfop: '5102', valorUnitario: 3500 },
    { codigo: 'MN002', descricao: 'Monitor LED 24', ncm: '85285200', cfop: '5102', valorUnitario: 900 },
    { codigo: 'TC003', descricao: 'Teclado mecanico', ncm: '84716053', cfop: '5102', valorUnitario: 250 },
    { codigo: 'CM004', descricao: 'Camiseta algodao', ncm: '61091000', cfop: '5101', valorUnitario: 45 },
    { codigo: 'CD005', descricao: 'Cadeira de escritorio', ncm: '94013000', cfop: '5102', valorUnitario: 650 },
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
function gerarChave(seq: number, rng: () => number): string {
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

export interface NFeGerada {
    chaveAcesso: string;
    xml: string;
    valorTotal: number;
}

/** Gera uma NFe fictícia. `seq` indexa a nota; `rng` controla a aleatoriedade. */
export function gerarNFe(seq: number, rng: () => number = makeRng(seq)): NFeGerada {
    const chave = gerarChave(seq, rng);
    const emit = pick(EMPRESAS, rng);
    let dest = pick(EMPRESAS, rng);
    while (dest.cnpj === emit.cnpj) dest = pick(EMPRESAS, rng);

    const prod = pick(PRODUTOS, rng);
    const qtd = 1 + Math.floor(rng() * 10);
    const vTotal = prod.valorUnitario * qtd;
    const data = new Date(2026, 0, 1 + Math.floor(rng() * 150), 10, 0, 0);
    const dhEmi = `${data.toISOString().slice(0, 19)}-03:00`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chave}">
    <ide>
      <cUF>35</cUF>
      <cNF>${pad(Math.floor(rng() * 1e8), 8)}</cNF>
      <natOp>VENDA</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>${seq}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>${emit.uf === dest.uf ? '1' : '2'}</idDest>
      <cMunFG>${emit.codMunicipio}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>0</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0</verProc>
    </ide>
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
    <det nItem="1">
      <prod>
        <cProd>${prod.codigo}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${prod.descricao}</xProd>
        <NCM>${prod.ncm}</NCM>
        <CFOP>${prod.cfop}</CFOP>
        <uCom>UN</uCom>
        <qCom>${qtd}.0000</qCom>
        <vUnCom>${prod.valorUnitario.toFixed(10)}</vUnCom>
        <vProd>${fmt(vTotal)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${qtd}.0000</qTrib>
        <vUnTrib>${prod.valorUnitario.toFixed(10)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${fmt(vTotal)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${fmt(vTotal)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>01</tPag>
        <vPag>${fmt(vTotal)}</vPag>
      </detPag>
    </pag>
  </infNFe>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="#NFe${chave}">
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

    return { chaveAcesso: chave, xml, valorTotal: vTotal };
}
