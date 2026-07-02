/**
 * Utilidades de pseudonimização para LGPD.
 *
 * No modelo de dados da NF-e, o campo `cnpj` de uma Empresa pode conter, no caso
 * de MEI/produtor rural pessoa física, um CPF (11 dígitos) em vez de um CNPJ
 * (14 dígitos). Quando o mascaramento LGPD está ativo (flag `LGPD_MASK_CPF`),
 * esses CPFs devem ser pseudonimizados em logs e na UI — CNPJs de pessoa
 * jurídica NÃO são dado pessoal e permanecem intactos.
 */

/** Um valor é um CPF quando, ignorando pontuação, tem exatamente 11 dígitos. */
export function isCpf(documento: string): boolean {
    return /^\d{11}$/.test(documento.replace(/\D/g, ''));
}

/**
 * Pseudonimiza um CPF preservando apenas os 2 dígitos verificadores finais
 * (suficiente para suporte/correlação sem expor o documento), no formato
 * `***.***.***-DD`. Ex.: `12345689100` → `***.***.***-00`. Retorna o documento
 * inalterado se não for um CPF (ex.: CNPJ de 14 dígitos ou string vazia).
 */
export function maskCpf(documento: string): string {
    const digits = documento.replace(/\D/g, '');
    if (!/^\d{11}$/.test(digits)) return documento;
    return `***.***.***-${digits.slice(-2)}`;
}

/**
 * Aplica {@link maskCpf} apenas quando o mascaramento está ativo; caso contrário
 * devolve o documento como está. Ponto único de decisão para logs e UI.
 */
export function maskCpfIf(ativo: boolean, documento: string): string {
    return ativo ? maskCpf(documento) : documento;
}
