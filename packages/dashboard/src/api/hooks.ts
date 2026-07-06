import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api.client.js';

export interface Overview {
    totalNFs: number;
    totalEmpresas: number;
    totalProdutos: number;
    valorTotalProcessado: number;
    nfsPorStatus: Record<string, number>;
    ultimasProcessadas: Array<{ chaveAcesso: string; numero: string; valorTotal: number; processadaEm: string; status?: string; emitente?: { cnpj: string; razaoSocial: string; uf: string } }>;
}

export interface NFListItem {
    chaveAcesso: string;
    numero: string;
    serie: string;
    dataEmissao: string;
    valorTotal: number;
    status: string;
    tipoNF: string;
    emitente?: { cnpj: string; razaoSocial: string; uf: string };
    destinatario?: { cnpj: string; razaoSocial: string; uf: string };
}

export interface NFPage {
    data: NFListItem[];
    pagination: { nextCursor: string | null; limit: number; hasMore: boolean };
    /** meta.total = total de NFs que casam os filtros (para "N de M"). */
    meta?: { total: number; filtrosAtivos?: string[] };
}

export interface TopEmpresa {
    posicao: number;
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
    valorTotal: number;
}

type QueryValue = string | number | boolean | undefined;
const qs = (params: Record<string, QueryValue>): string => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
    const s = sp.toString();
    return s ? `?${s}` : '';
};

export function useOverview() {
    return useQuery({ queryKey: ['stats', 'overview'], queryFn: () => apiFetch<Overview>('/stats/overview') });
}

export function useTopCompanies() {
    return useQuery({
        queryKey: ['stats', 'top-empresas'],
        queryFn: () => apiFetch<{ ranking: TopEmpresa[] }>('/stats/top-empresas?metrica=valor&limit=10'),
    });
}

export interface UfStat {
    uf: string;
    totalNFs: number;
    valorTotal: number;
}

export function useByUf(tipo: 'emitente' | 'destinatario' = 'emitente') {
    return useQuery({
        queryKey: ['stats', 'por-uf', tipo],
        queryFn: () => apiFetch<{ tipo: string; porUf: UfStat[] }>(`/stats/por-uf${qs({ tipo })}`),
    });
}

export function useVolume(granularidade = 'dia') {
    return useQuery({
        queryKey: ['stats', 'volume', granularidade],
        queryFn: () => apiFetch<{ serie: Array<{ periodo: string; totalNFs: number; valorTotal: number; canceladas: number }> }>(`/stats/volume${qs({ granularidade })}`),
    });
}

export function useNFList(filtros: Record<string, QueryValue>) {
    return useQuery({
        queryKey: ['nf', filtros],
        queryFn: () => apiFetch<NFPage>(`/nf${qs(filtros)}`),
    });
}

export function useNFDetail(chave: string) {
    return useQuery({
        queryKey: ['nf', 'detail', chave],
        queryFn: () => apiFetch<Record<string, unknown>>(`/nf/${chave}`),
        enabled: !!chave,
    });
}

export interface NFEvento {
    tipo: string;
    timestamp: string;
    autor?: string;
    ipOrigem?: string;
}

export function useNFEvents(chave: string) {
    return useQuery({
        queryKey: ['nf', 'eventos', chave],
        queryFn: () => apiFetch<{ chaveAcesso: string; eventos: NFEvento[] }>(`/nf/${chave}/eventos`),
        enabled: !!chave,
    });
}

export function useCompany(cnpj: string) {
    return useQuery({
        queryKey: ['empresa', cnpj],
        queryFn: () => apiFetch<Record<string, unknown>>(`/empresa/${cnpj}`),
        enabled: !!cnpj,
    });
}

export function useTopProducts() {
    return useQuery({
        queryKey: ['stats', 'top-produtos'],
        queryFn: () => apiFetch<{ ranking: Array<Record<string, unknown>> }>('/stats/top-produtos?limit=20'),
    });
}

export interface PrecoHistoricoPonto {
    periodo: string;
    precoMedio: number;
    quantidadeTotal: number;
    totalNFs: number;
}

export function usePriceHistory(idUnico: string) {
    return useQuery({
        queryKey: ['stats', 'produto-historico', idUnico],
        queryFn: () => apiFetch<{ idUnico: string; historico: PrecoHistoricoPonto[] }>(`/stats/produto/${encodeURIComponent(idUnico)}/historico`),
        enabled: !!idUnico,
    });
}

export interface ProdutoEmpresa {
    cnpj: string;
    razaoSocial: string;
    papel: 'emitente' | 'destinatario';
    totalNFs: number;
    /** Soma do valorTotal dos itens (aresta CONTÉM) desse produto. */
    valor: number;
}

/** Empresas ligadas a um produto (emitentes/destinatários) — /stats/produto/:id/empresas. */
export function useProductCompanies(idUnico: string) {
    return useQuery({
        queryKey: ['stats', 'produto-empresas', idUnico],
        queryFn: () => apiFetch<{ idUnico: string; empresas: ProdutoEmpresa[] }>(`/stats/produto/${encodeURIComponent(idUnico)}/empresas`),
        enabled: !!idUnico,
    });
}

export interface TaxStats {
    totais: { vICMS: number; vICMSST: number; vIPI: number; vPIS: number; vCOFINS: number; vII: number; vFCP: number };
    serie: Array<{ periodo: string; vICMS: number; vIPI: number; vPIS: number; vCOFINS: number }>;
    topNcm: Array<{ ncm: string; descricao?: string; totalImposto: number; vICMS: number; vIPI: number; vPIS: number; vCOFINS: number; totalNFs: number }>;
    topCfop: Array<{ cfop: string; descricao?: string; tipo?: string; vICMS: number; vIPI: number; totalNFs: number }>;
}

export function useTaxStats(filtros: Record<string, string | number | undefined> = {}) {
    return useQuery({
        queryKey: ['stats', 'impostos', filtros],
        queryFn: () => apiFetch<TaxStats>(`/stats/impostos${qs(filtros)}`),
    });
}

export interface FluxoAresta {
    de: string;
    para: string;
    deNome: string;
    paraNome: string;
    totalNFs: number;
    valorTotal: number;
}

export function useFluxo(limite = 30) {
    return useQuery({
        queryKey: ['stats', 'fluxo', limite],
        queryFn: () => apiFetch<{ arestas: FluxoAresta[]; limite: number }>(`/stats/fluxo${qs({ limite })}`),
    });
}

export interface RedeNo {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
}
export interface RedeAresta {
    de: string;
    para: string;
    totalNFs: number;
    valorTotal: number;
}

export function useRede(limite = 150) {
    return useQuery({
        queryKey: ['stats', 'rede', limite],
        queryFn: () => apiFetch<{ nos: RedeNo[]; arestas: RedeAresta[]; limite: number }>(`/stats/rede${qs({ limite })}`),
    });
}

export interface EventoGlobal {
    tipo: string;
    timestamp: string;
    autor: string | null;
    chaveAcesso: string;
    numero: string;
}

export function useEventos(params: { limit?: number; offset?: number; tipo?: string } = {}) {
    return useQuery({
        queryKey: ['stats', 'eventos', params],
        queryFn: () => apiFetch<{ eventos: EventoGlobal[]; total: number }>(`/stats/eventos${qs(params)}`),
    });
}
