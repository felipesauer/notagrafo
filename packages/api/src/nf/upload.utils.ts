import AdmZip from 'adm-zip';

/** Um XML extraído de um upload (single ou de dentro de um ZIP). */
export interface XmlExtraido {
    nome: string;
    conteudo: string;
}

/**
 * Extrai os XMLs de um upload: se for ZIP, todos os .xml internos; senão, o
 * próprio arquivo como um único XML.
 */
export function extrairXmls(buffer: Buffer, filename: string): XmlExtraido[] {
    const isZip = filename.toLowerCase().endsWith('.zip');
    if (!isZip) {
        return [{ nome: filename, conteudo: buffer.toString('utf8') }];
    }
    const zip = new AdmZip(buffer);
    return zip
        .getEntries()
        .filter((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.xml'))
        .map((e) => ({ nome: e.entryName, conteudo: e.getData().toString('utf8') }));
}
