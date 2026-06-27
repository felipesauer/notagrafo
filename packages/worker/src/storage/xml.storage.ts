/**
 * Interface única de storage do XML original da NFe.
 * Implementações: local (filesystem), s3 (AWS), minio (S3-compatível).
 * Selecionada por XML_STORAGE_DRIVER. Usada pelo RawData e por GET /nf/:chave/xml.
 */
export interface XmlStorage {
    /** Salva o XML da NF e retorna a referência de localização (path/uri/key). */
    save(chaveAcesso: string, xml: Buffer | string): Promise<string>;
    /** Recupera o XML original pela chave de acesso. */
    get(chaveAcesso: string): Promise<Buffer>;
    /** Indica se o XML de uma chave existe no storage. */
    exists(chaveAcesso: string): Promise<boolean>;
}

export type XmlStorageDriver = 'local' | 's3' | 'minio';

/** Nome do objeto/arquivo para uma chave de acesso. */
export function objectKey(chaveAcesso: string): string {
    return `${chaveAcesso}.xml`;
}
