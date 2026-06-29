import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import type { Driver } from 'neo4j-driver';
import { parseNFe, validateNFe, type RawDataNode } from '@notagrafo/core';
import { mergeInvoice, type InvoiceToPersist } from '@notagrafo/graph';
import type { XmlStorage } from '../storage/xml.storage.js';

/** Payload de um job de processamento de NFe. */
export interface ProcessNFeJobData {
    xml: string;
    /** Origem do upload (nome do arquivo, usuário), opcional para auditoria. */
    origem?: string;
}

export interface ProcessNFeResult {
    chaveAcesso: string;
    versao: string;
    storageRef: string;
}

/** Dependências injetadas no processor (facilita teste). */
export interface ProcessNFeDeps {
    driver: Driver;
    storage: XmlStorage;
    /** Reporta o progresso (0–100) nos marcos do pipeline. Opcional. */
    onProgress?: (pct: number) => void | Promise<void>;
}

/**
 * Pipeline de processamento de uma NFe: valida (XSD) → parseia → grava no grafo
 * → salva o XML no storage. Lança em qualquer falha para o BullMQ reagir
 * (retry/backoff/DLQ). Idempotente: mergeInvoice não duplica por chaveAcesso.
 */
export async function processNFe(
    data: ProcessNFeJobData,
    deps: ProcessNFeDeps,
): Promise<ProcessNFeResult> {
    const { xml } = data;
    const report = async (pct: number): Promise<void> => {
        await deps.onProgress?.(pct);
    };

    // 1. Validação XSD (lança se inválido ou versão não suportada)
    const validacao = validateNFe(xml);
    if (!validacao.valid) {
        throw new Error(`XML inválido contra o XSD ${validacao.versao}: ${validacao.errors.join('; ')}`);
    }
    await report(25);

    // 2. Parse
    const parsed = parseNFe(xml, new Date());

    // 3. Monta o RawData
    const raw: RawDataNode = {
        xmlGzip: gzipSync(Buffer.from(xml)),
        jsonCompleto: JSON.stringify(parsed),
        checksum: createHash('sha256').update(xml).digest('hex'),
        tamanhoBytes: Buffer.byteLength(xml),
        versaoSchema: validacao.versao,
    };
    await report(50);

    // 4. Grava no grafo (idempotente por chaveAcesso)
    const payload: InvoiceToPersist = { ...parsed, raw };
    await mergeInvoice(deps.driver, payload);
    await report(75);

    // 5. Salva o XML original no storage
    const storageRef = await deps.storage.save(parsed.nota.chaveAcesso, xml);
    await report(100);

    return { chaveAcesso: parsed.nota.chaveAcesso, versao: validacao.versao, storageRef };
}
