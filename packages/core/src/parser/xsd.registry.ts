import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Diretório raiz dos XSDs versionados (packages/core/src/schemas/xsd). */
const XSD_ROOT = join(__dirname, '..', 'schemas', 'xsd');

/**
 * Mapeia uma `versaoSchema` declarada no XML para o XSD raiz que a valida.
 * Apenas versões com XSD presente em disco são suportadas (ADR NOTA-ADR-3:
 * o MVP suporta somente v4.00; outras versões caem no caminho de erro claro).
 */
const VERSION_TO_XSD: Record<string, string> = {
    '4.00': join(XSD_ROOT, 'v4.00', 'nfe_v4.00.xsd'),
};

/** Erro lançado quando o XML declara uma versão sem XSD correspondente. */
export class VersaoSchemaNaoSuportadaError extends Error {
    readonly versao: string;
    constructor(versao: string) {
        super(
            `Versão de schema ${versao} não suportada. Adicione o XSD em ` +
                `packages/core/src/schemas/xsd/${versao}/ para habilitar suporte.`,
        );
        this.name = 'VersaoSchemaNaoSuportadaError';
        this.versao = versao;
    }
}

/** Retorna true se a versão tem um XSD presente em disco. */
export function isVersaoSuportada(versao: string): boolean {
    const path = VERSION_TO_XSD[versao];
    return path !== undefined && existsSync(path);
}

/**
 * Resolve o caminho absoluto do XSD raiz para a versão declarada.
 * @throws {VersaoSchemaNaoSuportadaError} se a versão não tiver XSD.
 */
export function resolveXsdPath(versao: string): string {
    const path = VERSION_TO_XSD[versao];
    if (path === undefined || !existsSync(path)) {
        throw new VersaoSchemaNaoSuportadaError(versao);
    }
    return path;
}

/** Lista as versões suportadas (com XSD presente em disco). */
export function versoesSuportadas(): string[] {
    return Object.keys(VERSION_TO_XSD).filter(isVersaoSuportada);
}
