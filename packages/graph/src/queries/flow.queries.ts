import neo4j, { type Driver } from 'neo4j-driver';

const toNum = (v: unknown): number =>
    typeof v === 'number'
        ? v
        : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
          ? (v as { toNumber: () => number }).toNumber()
          : Number(v ?? 0);

/** Uma aresta do fluxo: valor agregado que fluiu de um emitente a um destinatário. */
export interface FluxoAresta {
    de: string; // CNPJ do emitente
    para: string; // CNPJ do destinatário
    deNome: string;
    paraNome: string;
    totalNFs: number;
    valorTotal: number;
}

export interface FluxoEmpresas {
    arestas: FluxoAresta[];
    limite: number;
}

/**
 * Fluxo de valor agregado entre empresas (emitente → destinatário) em toda a base.
 * Retorna os `limite` pares de maior valor total — alimenta o diagrama de Sankey
 * (origem → destino, espessura ∝ valor). Ignora laços (emitente = destinatário).
 */
export async function getFluxoEmpresas(driver: Driver, opts: { limite?: number } = {}): Promise<FluxoEmpresas> {
    const limite = Math.min(Math.max(opts.limite ?? 30, 1), 100);
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa)
             WHERE a.cnpj <> b.cnpj
             WITH a, b, count(nf) AS totalNFs, sum(nf.valorTotal) AS valorTotal
             RETURN a.cnpj AS de, b.cnpj AS para,
                    a.razaoSocial AS deNome, b.razaoSocial AS paraNome,
                    totalNFs, valorTotal
             ORDER BY valorTotal DESC
             LIMIT $limite`,
            { limite: neo4j.int(limite) },
        );
        const arestas: FluxoAresta[] = res.records.map((r) => ({
            de: r.get('de') as string,
            para: r.get('para') as string,
            deNome: (r.get('deNome') as string) ?? '',
            paraNome: (r.get('paraNome') as string) ?? '',
            totalNFs: toNum(r.get('totalNFs')),
            valorTotal: toNum(r.get('valorTotal')),
        }));
        return { arestas, limite };
    } finally {
        await session.close();
    }
}

/** Um nó da rede global: uma empresa e o seu grau de atividade. */
export interface RedeNo {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number; // NFs emitidas + recebidas (dimensiona o nó)
}

/** Uma aresta da rede global: relação comercial agregada entre duas empresas. */
export interface RedeAresta {
    de: string;
    para: string;
    totalNFs: number;
    valorTotal: number;
}

export interface RedeGlobal {
    nos: RedeNo[];
    arestas: RedeAresta[];
    limite: number;
}

/**
 * Rede comercial completa da base: empresas (nós) e as relações agregadas
 * emitente→destinatário (arestas). Aplica um limite de segurança nas arestas
 * (as `limite` de maior valor) e traz apenas os nós que participam delas — o
 * suficiente para uma exploração em força/WebGL sem carregar a base inteira.
 */
export async function getRedeGlobal(
    driver: Driver,
    opts: { limite?: number; dataInicio?: string; dataFim?: string } = {},
): Promise<RedeGlobal> {
    const limite = Math.min(Math.max(opts.limite ?? 150, 1), 500);
    const session = driver.session();
    try {
        // Recorte temporal opcional (EPIC-28): restringe as arestas às NF emitidas
        // na janela [dataInicio, dataFim], para ver como a rede cresceu no período.
        const dateFilter: string[] = [];
        const params: Record<string, unknown> = { limite: neo4j.int(limite) };
        if (opts.dataInicio) (dateFilter.push('nf.dataEmissao >= $dataInicio'), (params.dataInicio = opts.dataInicio));
        if (opts.dataFim) (dateFilter.push('nf.dataEmissao <= $dataFim'), (params.dataFim = opts.dataFim + '￿'));
        const dateClause = dateFilter.length ? ` AND ${dateFilter.join(' AND ')}` : '';

        // Arestas: top-N relações por valor (mesmo padrão do fluxo, sem laços).
        const arestasRes = await session.run(
            `MATCH (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa)
             WHERE a.cnpj <> b.cnpj${dateClause}
             WITH a, b, count(nf) AS totalNFs, sum(nf.valorTotal) AS valorTotal
             RETURN a.cnpj AS de, b.cnpj AS para, totalNFs, valorTotal
             ORDER BY valorTotal DESC
             LIMIT $limite`,
            params,
        );
        const arestas: RedeAresta[] = arestasRes.records.map((r) => ({
            de: r.get('de') as string,
            para: r.get('para') as string,
            totalNFs: toNum(r.get('totalNFs')),
            valorTotal: toNum(r.get('valorTotal')),
        }));

        // Nós: só as empresas que aparecem nas arestas selecionadas, com o grau
        // de atividade total (emitidas + recebidas) para dimensionar o nó.
        const cnpjs = [...new Set(arestas.flatMap((a) => [a.de, a.para]))];
        let nos: RedeNo[] = [];
        if (cnpjs.length > 0) {
            const nosRes = await session.run(
                `MATCH (e:Empresa) WHERE e.cnpj IN $cnpjs
                 OPTIONAL MATCH (e)-[:EMITIU]->(nfE:NotaFiscal)
                 WITH e, count(nfE) AS emitidas
                 OPTIONAL MATCH (e)<-[:DESTINADA_A]-(nfR:NotaFiscal)
                 WITH e, emitidas, count(nfR) AS recebidas
                 RETURN e.cnpj AS cnpj, e.razaoSocial AS razaoSocial, e.uf AS uf,
                        (emitidas + recebidas) AS totalNFs`,
                { cnpjs },
            );
            nos = nosRes.records.map((r) => ({
                cnpj: r.get('cnpj') as string,
                razaoSocial: (r.get('razaoSocial') as string) ?? '',
                uf: (r.get('uf') as string) ?? '',
                totalNFs: toNum(r.get('totalNFs')),
            }));
        }

        return { nos, arestas, limite };
    } finally {
        await session.close();
    }
}
