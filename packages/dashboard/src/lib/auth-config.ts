/**
 * Resolve se a autenticação é exigida no dashboard, a partir das flags de
 * build (Vite expõe via `import.meta.env.VITE_*`).
 *
 * - `VITE_AUTH_ENABLED` (padrão true): liga/desliga a auth de forma geral.
 * - `VITE_DEMO_AUTH_ENABLED` (padrão true): quando `VITE_DEMO=true`, SOBREPÕE
 *   a geral.
 *
 * Mesma semântica do backend (ver api/src/auth/auth.plugin.ts → isAuthRequired):
 * em modo demo manda a flag de demo; fora dele manda a geral.
 */
export function isAuthRequired(): boolean {
    const env = import.meta.env;
    const enabled = (v: string | undefined) => v !== 'false';
    return env.VITE_DEMO === 'true'
        ? enabled(env.VITE_DEMO_AUTH_ENABLED)
        : enabled(env.VITE_AUTH_ENABLED);
}
