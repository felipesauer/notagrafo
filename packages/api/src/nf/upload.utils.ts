import AdmZip from 'adm-zip';
import { ApiError } from '../errors.js';

/** Um XML extraído de um upload (single ou de dentro de um ZIP). */
export interface XmlExtraido {
    nome: string;
    conteudo: string;
}

/** Limites anti zip bomb ao descompactar um upload ZIP. */
export interface LimitesZip {
    /** Máximo de entradas .xml consideradas dentro do ZIP. */
    maxEntradas: number;
    /** Máximo de bytes descomprimidos somados (soma dos `header.size`). */
    maxBytesDescomprimidos: number;
    /**
     * Razão máxima de compressão agregada (descomprimido / comprimido). Uma
     * razão muito alta é a assinatura clássica de uma zip bomb.
     */
    maxRazaoCompressao: number;
}

/** Defaults sensatos para o MVP: cobrem lotes reais sem abrir a porta para DoS. */
export const LIMITES_ZIP_PADRAO: LimitesZip = {
    maxEntradas: 1_000,
    maxBytesDescomprimidos: 512 * 1024 * 1024, // 512 MiB
    maxRazaoCompressao: 200,
};

/**
 * Extrai os XMLs de um upload: se for ZIP, todos os .xml internos; senão, o
 * próprio arquivo como um único XML.
 *
 * Para uploads ZIP, aplica limites anti zip bomb (contagem de entradas, tamanho
 * total descomprimido e razão de compressão) usando os metadados do diretório
 * central — verificados ANTES de materializar qualquer conteúdo em memória.
 */
export function extrairXmls(
    buffer: Buffer,
    filename: string,
    limites: LimitesZip = LIMITES_ZIP_PADRAO,
): XmlExtraido[] {
    const isZip = filename.toLowerCase().endsWith('.zip');
    if (!isZip) {
        return [{ nome: filename, conteudo: buffer.toString('utf8') }];
    }

    const zip = new AdmZip(buffer);
    const entradas = zip.getEntries();

    // Barra flood do diretório central ANTES de filtrar por .xml: um ZIP com
    // um número enorme de entradas (mesmo não-XML e vazias) consome CPU/memória
    // só no parsing dos metadados. O limite vale sobre o TOTAL de entradas.
    if (entradas.length > limites.maxEntradas) {
        throw ApiError.badRequest(
            `ZIP com entradas demais: ${entradas.length} arquivos (máximo ${limites.maxEntradas}).`,
        );
    }

    const xmlEntries = entradas.filter(
        (e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.xml'),
    );

    // Checagem via metadados do header (sem descomprimir) — soma o tamanho
    // descomprimido e detecta razões de compressão suspeitas por entrada.
    let totalDescomprimido = 0;
    for (const e of xmlEntries) {
        const tamanho = e.header.size;
        const comprimido = e.header.compressedSize;
        totalDescomprimido += tamanho;
        if (totalDescomprimido > limites.maxBytesDescomprimidos) {
            throw ApiError.badRequest(
                `Conteúdo descomprimido do ZIP excede o limite de ${limites.maxBytesDescomprimidos} bytes.`,
            );
        }
        if (comprimido > 0 && tamanho / comprimido > limites.maxRazaoCompressao) {
            throw ApiError.badRequest(
                `Entrada "${e.entryName}" tem razão de compressão suspeita (possível zip bomb).`,
            );
        }
    }

    return xmlEntries.map((e) => ({ nome: e.entryName, conteudo: e.getData().toString('utf8') }));
}
