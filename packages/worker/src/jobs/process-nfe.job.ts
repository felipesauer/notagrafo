import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import type { Driver } from 'neo4j-driver';
import { parseNFe, validarNFe, type RawDataNode } from '@notagrafo/core';
import { mergeNotaFiscal, type NotaFiscalParaGravar } from '@notagrafo/graph';
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
}

/**
 * Pipeline de processamento de uma NFe: valida (XSD) → parseia → grava no grafo
 * → salva o XML no storage. Lança em qualquer falha para o BullMQ reagir
 * (retry/backoff/DLQ). Idempotente: mergeNotaFiscal não duplica por chaveAcesso.
 */
export async function processNFe(
    data: ProcessNFeJobData,
    deps: ProcessNFeDeps,
): Promise<ProcessNFeResult> {
    const { xml } = data;

    // 1. Validação XSD (lança se inválido ou versão não suportada)
    const validacao = validarNFe(xml);
    if (!validacao.valid) {
        throw new Error(`XML inválido contra o XSD ${validacao.versao}: ${validacao.errors.join('; ')}`);
    }

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

    // 4. Grava no grafo (idempotente por chaveAcesso)
    const payload: NotaFiscalParaGravar = { ...parsed, raw };
    await mergeNotaFiscal(deps.driver, payload);

    // 5. Salva o XML original no storage
    const storageRef = await deps.storage.save(parsed.nota.chaveAcesso, xml);

    return { chaveAcesso: parsed.nota.chaveAcesso, versao: validacao.versao, storageRef };
}
