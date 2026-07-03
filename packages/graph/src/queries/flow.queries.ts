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
