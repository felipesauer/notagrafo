import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api.client.js';

export interface Overview {
    totalNFs: number;
    totalEmpresas: number;
    totalProdutos: number;
    valorTotalProcessado: number;
    nfsPorStatus: Record<string, number>;
    ultimasProcessadas: Array<{ chaveAcesso: string; numero: string; valorTotal: number; processadaEm: string }>;
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
}

export interface TopEmpresa {
    posicao: number;
    cnpj: string;
    razaoSocial: string;
    uf: string;
    totalNFs: number;
    valorTotal: number;
}

const qs = (params: Record<string, string | number | undefined>): string => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
    const s = sp.toString();
    return s ? `?${s}` : '';
};

export function useOverview() {
    return useQuery({ queryKey: ['stats', 'overview'], queryFn: () => apiFetch<Overview>('/stats/overview') });
}

export function useTopEmpresas() {
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

export function usePorUf(tipo: 'emitente' | 'destinatario' = 'emitente') {
    return useQuery({
        queryKey: ['stats', 'por-uf', tipo],
        queryFn: () => apiFetch<{ tipo: string; porUf: UfStat[] }>(`/stats/por-uf${qs({ tipo })}`),
    });
}

export function useVolume(granularidade = 'dia') {
    return useQuery({
        queryKey: ['stats', 'volume', granularidade],
        queryFn: () => apiFetch<{ serie: Array<{ periodo: string; totalNFs: number; valorTotal: number }> }>(`/stats/volume${qs({ granularidade })}`),
    });
}

export function useNFList(filtros: Record<string, string | number | undefined>) {
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

export function useEmpresa(cnpj: string) {
    return useQuery({
        queryKey: ['empresa', cnpj],
        queryFn: () => apiFetch<Record<string, unknown>>(`/empresa/${cnpj}`),
        enabled: !!cnpj,
    });
}

export function useTopProdutos() {
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

export function useHistoricoPreco(idUnico: string) {
    return useQuery({
        queryKey: ['stats', 'produto-historico', idUnico],
        queryFn: () => apiFetch<{ idUnico: string; historico: PrecoHistoricoPonto[] }>(`/stats/produto/${encodeURIComponent(idUnico)}/historico`),
        enabled: !!idUnico,
    });
}
