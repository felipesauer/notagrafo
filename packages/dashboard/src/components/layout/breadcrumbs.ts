/**
 * Trilha de breadcrumb a partir do pathname. Substitui o mapa TITULOS do antigo
 * AppLayout, que não cobria /impostos nem /nf/$chave (o breadcrumb caía no
 * fallback "Visão geral"). Cada segmento é uma chave de i18n; o último é a página
 * atual (sem link).
 */

export interface Crumb {
    /** Chave i18n do rótulo, OU rótulo literal quando `literal` é true. */
    label: string;
    literal?: boolean;
    /** Destino do link; ausente no último (página atual). */
    to?: string;
}

const ROOT: Crumb = { label: 'sidebar.overview', to: '/' };

/** Mapa rota exata → chave i18n do rótulo da página. */
const ROTA_LABEL: Record<string, string> = {
    '/': 'sidebar.overview',
    '/nf': 'sidebar.nfs',
    '/empresas': 'sidebar.empresas',
    '/produtos': 'sidebar.produtos',
    '/impostos': 'sidebar.impostos',
    '/grafo': 'sidebar.grafo',
    '/exportacoes': 'sidebar.exportacoes',
    '/configuracoes': 'sidebar.configuracoes',
};

/**
 * Constrói a trilha para o pathname dado.
 * - `/` → [Visão geral]
 * - rotas de topo → [Visão geral, <página>]
 * - `/nf/<chave>` → [Visão geral, Notas Fiscais, <chave truncada>]
 */
export function breadcrumbsFor(pathname: string): Crumb[] {
    if (pathname === '/') return [{ label: 'sidebar.overview' }];

    // Detalhe da NF: /nf/<chave> — trilha com o pai "Notas Fiscais".
    const nfDetail = pathname.match(/^\/nf\/(.+)$/);
    if (nfDetail) {
        const chave = nfDetail[1]!;
        const curta = chave.length > 16 ? `${chave.slice(0, 8)}…${chave.slice(-6)}` : chave;
        return [ROOT, { label: 'sidebar.nfs', to: '/nf' }, { label: curta, literal: true }];
    }

    const label = ROTA_LABEL[pathname];
    if (label) return [ROOT, { label }];

    // Rota desconhecida: só a raiz.
    return [{ label: 'sidebar.overview' }];
}
