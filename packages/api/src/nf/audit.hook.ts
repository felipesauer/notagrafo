import type { Driver } from 'neo4j-driver';

/**
 * Cria um evento de auditoria 'consultada' para uma NF, de forma ASSÍNCRONA
 * (regra 4 da seção 9): nunca aguardar a gravação para responder ao cliente.
 * Erros são apenas logados — auditoria não pode quebrar a resposta.
 */
export function registrarConsulta(
    driver: Driver,
    chaveAcesso: string,
    contexto: { autor?: string; ipOrigem?: string } = {},
    onError?: (err: unknown) => void,
): void {
    // Dispara sem await — fire-and-forget.
    void (async () => {
        const session = driver.session();
        try {
            await session.run(
                `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                 CREATE (ev:Evento {tipo: 'consultada', timestamp: datetime(), autor: $autor})
                 SET ev += $extra
                 MERGE (nf)-[:TEM_EVENTO]->(ev)`,
                {
                    chave: chaveAcesso,
                    autor: contexto.autor ?? 'sistema',
                    extra: contexto.ipOrigem ? { ipOrigem: contexto.ipOrigem } : {},
                },
            );
        } catch (err) {
            onError?.(err);
        } finally {
            await session.close();
        }
    })();
}
