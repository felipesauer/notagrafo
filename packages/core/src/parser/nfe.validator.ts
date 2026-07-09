import { readFileSync } from 'node:fs';
import { parseXml, type Document } from 'libxmljs2';
import { resolveXsdPath, VersaoSchemaNaoSuportadaError } from './xsd.registry.js';

/** Resultado da validação de um XML de NFe contra o XSD oficial. */
export interface ValidationResult {
    valid: boolean;
    versao: string;
    /** Mensagens de erro do XSD (vazio quando valid === true). */
    errors: string[];
}

/** Erro lançado quando o XML não é sequer bem-formado ou não declara a versão. */
export class XmlMalformadoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'XmlMalformadoError';
    }
}

/** Cache de XSDs já parseados, por caminho — parsear o leiaute é caro. */
const xsdCache = new Map<string, Document>();

function loadXsd(path: string): Document {
    const cached = xsdCache.get(path);
    if (cached) return cached;
    // baseUrl permite ao libxml resolver os <xs:include> relativos ao XSD raiz.
    const doc = parseXml(readFileSync(path, 'utf8'), { baseUrl: path });
    xsdCache.set(path, doc);
    return doc;
}

/** Extrai o atributo `versao` do elemento infNFe. */
function extractVersion(doc: Document): string | null {
    const infNFe = doc.get(
        '//*[local-name()="infNFe"]',
    ) as { attr(name: string): { value(): string } | null } | null;
    const versao = infNFe?.attr('versao')?.value();
    return versao ?? null;
}

/**
 * Valida um XML de NFe contra o XSD oficial da SEFAZ da sua versão declarada
 * (`infNFe/@versao`), via libxmljs2. Não reimplementa as regras do XSD
 * (regra 2 da seção 6 do 01 schema dados.md).
 *
 * @throws {XmlMalformadoError} se o XML não for bem-formado ou não declarar versão.
 * @throws {VersaoSchemaNaoSuportadaError} se a versão não tiver XSD (regra 3).
 */
export function validateNFe(xml: string): ValidationResult {
    let doc: Document;
    try {
        // Opções de segurança EXPLÍCITAS para o XML do usuário (não confiável):
        // não expandir entidades (noent:false → sem billion-laughs por substituição),
        // não carregar/validar DTD (dtdload/dtdvalid:false), sem acesso à rede
        // (nonet:true → sem SSRF/XXE externo) e sem relaxar limites (huge:false). A
        // versão atual do libxml2 já é segura por default (verificado: entity loop
        // detectado, DTD externo não buscado) — isto trava o comportamento para não
        // depender do default da lib. NFe não usa DTD/entidades (NOTA-204).
        doc = parseXml(xml, { noent: false, dtdload: false, dtdvalid: false, nonet: true, huge: false });
    } catch (err) {
        throw new XmlMalformadoError(
            `XML mal-formado: ${err instanceof Error ? err.message : String(err)}`,
        );
    }

    const versao = extractVersion(doc);
    if (!versao) {
        throw new XmlMalformadoError(
            'XML não declara a versão do schema (infNFe/@versao ausente).',
        );
    }

    // Lança VersaoSchemaNaoSuportadaError se não houver XSD para a versão.
    const xsdPath = resolveXsdPath(versao);
    const xsd = loadXsd(xsdPath);

    const valid = doc.validate(xsd);
    const errors = valid ? [] : doc.validationErrors.map((e) => e.message?.trim() ?? String(e));

    return { valid, versao, errors };
}

export { VersaoSchemaNaoSuportadaError };
