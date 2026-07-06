import neo4j, { type Driver } from 'neo4j-driver';

export type Direction = 'emitente' | 'destinatario' | 'both';

export interface GrafoOptions {
    depth?: number; // 1..4 (padrão 1)
    direction?: Direction; // padrão 'both'
    limit?: number; // padrão 100
    includeProdutos?: boolean; // inclui os produtos emitidos pela empresa-raiz (padrão false)
    includeNotas?: boolean; // inclui as NF-e trocadas entre a raiz e os vizinhos (padrão false)
    notasLimit?: number; // teto de nós de NF-e (anti-hairball; padrão 30)
}

export interface NoVizinho {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    grau: number;
    relacao: 'emitente' | 'destinatario';
    totalNFs: number;
}

export interface ArestaGrafo {
    de: string;
    para: string;
    totalNFs: number;
    valorTotal: number;
}

/** Produto emitido pela empresa-raiz (nó de produto opcional no grafo visual). */
export interface ProdutoNoGrafo {
    idUnico: string;
    descricao: string;
    ncm: string;
    totalNFs: number;
    valorTotal: number;
}

/** NF-e trocada entre a raiz e um vizinho (nó de nota opcional no grafo visual). */
export interface NotaNoGrafo {
    chaveAcesso: string;
    numero: string;
    valorTotal: number;
    status: string;
    /** CNPJ do emitente e do destinatário — para ligar a nota às duas empresas. */
    cnpjEmitente: string;
    cnpjDestinatario: string;
}

export interface EmpresaGrafo {
    cnpj: string;
    depth: number;
    nos: NoVizinho[];
    arestas: ArestaGrafo[];
    /** Presente apenas quando includeProdutos=true. Produtos emitidos pela empresa-raiz. */
    produtos?: ProdutoNoGrafo[];
    /** Presente apenas quando includeNotas=true. NF-e trocadas com os vizinhos. */
    notas?: NotaNoGrafo[];
}

export interface EmpresaStats {
    totalNFsEmitidas: number;
    totalNFsRecebidas: number;
    valorTotalEmitido: number;
    primeiraEmissao: string | null;
    ultimaEmissao: string | null;
}

export class DepthForaDoLimiteError extends Error {
    constructor(depth: number) {
        super(`depth ${depth} fora do limite permitido (1..4).`);
        this.name = 'DepthForaDoLimiteError';
    }
}

const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
        ? (v as { toNumber: () => number }).toNumber()
        : Number(v ?? 0);

/** Estatísticas agregadas de uma empresa (NFs emitidas/recebidas, valores, datas). */
export async function getCompanyStats(driver: Driver, cnpj: string): Promise<EmpresaStats> {
    const session = driver.session();
    try {
        // Emitidas e recebidas são agregadas em ramos SEPARADOS: juntar os dois
        // OPTIONAL MATCH no mesmo escopo cruzaria emitida×recebida e inflaria as
        // somas. sum() simples (não DISTINCT) — DISTINCT subcontaria NFs de mesmo
        // valor (auditoria F4).
        const res = await session.run(
            `MATCH (e:Empresa {cnpj: $cnpj})
             OPTIONAL MATCH (e)-[:EMITIU]->(emitida:NotaFiscal)
             WITH e, count(emitida) AS emitidas, sum(emitida.valorTotal) AS valorEmitido,
                  min(emitida.dataEmissao) AS primeira, max(emitida.dataEmissao) AS ultima
             OPTIONAL MATCH (e)<-[:DESTINADA_A]-(recebida:NotaFiscal)
             RETURN emitidas, count(recebida) AS recebidas, valorEmitido, primeira, ultima`,
            { cnpj },
        );
        const r = res.records[0];
        return {
            totalNFsEmitidas: toNum(r?.get('emitidas')),
            totalNFsRecebidas: toNum(r?.get('recebidas')),
            valorTotalEmitido: toNum(r?.get('valorEmitido')),
            primeiraEmissao: (r?.get('primeira') as string | null) ?? null,
            ultimaEmissao: (r?.get('ultima') as string | null) ?? null,
        };
    } finally {
        await session.close();
    }
}

/**
 * Vizinhos da empresa no grafo de transações até `depth` graus (máx 4).
 * `direction` filtra empresas alcançadas como emitente, destinatário ou ambos.
 */
export async function getCompanyGraph(
    driver: Driver,
    cnpj: string,
    opts: GrafoOptions = {},
): Promise<EmpresaGrafo> {
    const depth = opts.depth ?? 1;
    const direction = opts.direction ?? 'both';
    const limit = opts.limit ?? 100;
    if (depth < 1 || depth > 4) throw new DepthForaDoLimiteError(depth);

    // Padrão de caminho conforme a direção desejada.
    const rel =
        direction === 'emitente'
            ? '-[:EMITIU|DESTINADA_A*1..%d]-'
            : direction === 'destinatario'
              ? '-[:DESTINADA_A|EMITIU*1..%d]-'
              : '-[:EMITIU|DESTINADA_A*1..%d]-';
    const pattern = rel.replace('%d', String(depth * 2));

    const session = driver.session();
    try {
        const nodesRes = await session.run(
            // relacao = papel do vizinho na relação DIRETA com a raiz: se a raiz
            // emitiu para ele, é 'destinatario'; se ele emitiu para a raiz, é
            // 'emitente'. Contamos as NFs trocadas nos dois sentidos; o CASE
            // rotula pelo sentido predominante (empate → 'emitente').
            `MATCH (origem:Empresa {cnpj: $cnpj})
             MATCH path = (origem)${pattern}(viz:Empresa)
             WHERE viz.cnpj <> $cnpj
             WITH origem, viz, min(length(path)) AS dist
             OPTIONAL MATCH (viz)-[:EMITIU]->(:NotaFiscal)-[:DESTINADA_A]->(origem)
             WITH origem, viz, dist, count(*) AS comoEmitente
             OPTIONAL MATCH (origem)-[:EMITIU]->(:NotaFiscal)-[:DESTINADA_A]->(viz)
             WITH viz, dist, comoEmitente, count(*) AS comoDestinatario
             RETURN viz.cnpj AS cnpj, viz.razaoSocial AS razaoSocial, viz.uf AS uf,
                    (dist / 2) AS grau,
                    (comoEmitente + comoDestinatario) AS totalNFs,
                    CASE WHEN comoDestinatario > comoEmitente THEN 'destinatario' ELSE 'emitente' END AS relacao
             ORDER BY grau ASC, totalNFs DESC
             LIMIT $limit`,
            { cnpj, limit: neo4j.int(limit) },
        );
        const nos: NoVizinho[] = nodesRes.records.map((r) => ({
            cnpj: r.get('cnpj') as string,
            razaoSocial: (r.get('razaoSocial') as string) ?? '',
            uf: (r.get('uf') as string) ?? '',
            grau: Math.max(1, toNum(r.get('grau'))),
            relacao: (r.get('relacao') as 'emitente' | 'destinatario') ?? 'emitente',
            totalNFs: toNum(r.get('totalNFs')),
        }));

        const edgesRes = await session.run(
            `MATCH (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa)
             WHERE a.cnpj = $cnpj OR b.cnpj = $cnpj
             RETURN a.cnpj AS de, b.cnpj AS para, count(nf) AS totalNFs,
                    sum(nf.valorTotal) AS valorTotal
             LIMIT $limit`,
            { cnpj, limit: neo4j.int(limit) },
        );
        const arestas: ArestaGrafo[] = edgesRes.records.map((r) => ({
            de: r.get('de') as string,
            para: r.get('para') as string,
            totalNFs: toNum(r.get('totalNFs')),
            valorTotal: toNum(r.get('valorTotal')),
        }));

        // Produtos da empresa-raiz (opcional): nós de Produto para o grafo visual.
        let produtos: ProdutoNoGrafo[] | undefined;
        if (opts.includeProdutos) {
            const prodRes = await session.run(
                `MATCH (origem:Empresa {cnpj: $cnpj})-[:EMITIU]->(nf:NotaFiscal)-[c:CONTÉM]->(p:Produto)
                 OPTIONAL MATCH (p)-[:CLASSIFICADO_EM]->(ncm:NCM)
                 WITH p, ncm, count(DISTINCT nf) AS totalNFs, sum(c.valorTotal) AS valorTotal
                 RETURN p.idUnico AS idUnico, p.descricao AS descricao, ncm.codigo AS ncm,
                        totalNFs, valorTotal
                 ORDER BY valorTotal DESC
                 LIMIT $limit`,
                { cnpj, limit: neo4j.int(limit) },
            );
            produtos = prodRes.records.map((r) => ({
                idUnico: r.get('idUnico') as string,
                descricao: (r.get('descricao') as string) ?? '',
                ncm: (r.get('ncm') as string) ?? '',
                totalNFs: toNum(r.get('totalNFs')),
                valorTotal: toNum(r.get('valorTotal')),
            }));
        }

        // NF-e trocadas entre a raiz e os vizinhos (opcional): nós de NotaFiscal
        // para o grafo visual. Limitado por notasLimit (anti-hairball) — as maiores
        // por valor. Cada nota liga o emitente ao destinatário.
        let notas: NotaNoGrafo[] | undefined;
        if (opts.includeNotas) {
            const notasLimit = opts.notasLimit ?? 30;
            const notasRes = await session.run(
                // Exclui stubs (status IS NULL) e devoluções (finalidade='devolucao'),
                // consistente com product/tax.queries — senão o grafo mostraria NF-e
                // que não aparecem em nenhum agregado.
                `MATCH (e:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(d:Empresa)
                 WHERE (e.cnpj = $cnpj OR d.cnpj = $cnpj) AND nf.status IS NOT NULL
                       AND coalesce(nf.finalidade, '') <> 'devolucao'
                 RETURN nf.chaveAcesso AS chaveAcesso, nf.numero AS numero,
                        nf.valorTotal AS valorTotal, nf.status AS status,
                        e.cnpj AS cnpjEmitente, d.cnpj AS cnpjDestinatario
                 ORDER BY nf.valorTotal DESC
                 LIMIT $notasLimit`,
                { cnpj, notasLimit: neo4j.int(notasLimit) },
            );
            notas = notasRes.records.map((r) => ({
                chaveAcesso: r.get('chaveAcesso') as string,
                numero: (r.get('numero') as string) ?? '',
                valorTotal: toNum(r.get('valorTotal')),
                status: (r.get('status') as string) ?? '',
                cnpjEmitente: r.get('cnpjEmitente') as string,
                cnpjDestinatario: r.get('cnpjDestinatario') as string,
            }));
        }

        return { cnpj, depth, nos, arestas, ...(produtos ? { produtos } : {}), ...(notas ? { notas } : {}) };
    } finally {
        await session.close();
    }
}
