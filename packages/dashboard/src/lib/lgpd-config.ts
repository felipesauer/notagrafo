/**
 * Resolve se o mascaramento LGPD de CPF está ativo no dashboard, a partir da
 * flag de build (Vite expõe via `import.meta.env.VITE_*`).
 *
 * - `VITE_LGPD_MASK_CPF` (padrão false): quando `true`, CPFs de MEI exibidos na
 *   UI (campo `cnpj` com 11 dígitos) são pseudonimizados. Espelha a flag
 *   `LGPD_MASK_CPF` do backend.
 */
export function isCpfMaskingEnabled(): boolean {
    return import.meta.env.VITE_LGPD_MASK_CPF === 'true';
}
