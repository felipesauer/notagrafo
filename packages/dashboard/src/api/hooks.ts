import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export interface PeriodComparison {
    current: { totalNFs: number; valorTotal: number };
    previous: { totalNFs: number; valorTotal: number };
    yearAgo: { totalNFs: number; valorTotal: number };
    changeVsPrevious: { totalNFs?: number; valorTotal?: number };
    changeVsYearAgo: { totalNFs?: number; valorTotal?: number };
}

/** Compares [dataInicio, dataFim] with the previous period and one year ago (EPIC-26). */
export function usePeriodComparison(dataInicio?: string, dataFim?: string) {
    return useQuery({
        queryKey: ['stats', 'comparativo', dataInicio, dataFim],
        queryFn: () => apiFetch<PeriodComparison>(`/stats/comparison${qs({ dataInicio, dataFim })}`),
        enabled: !!dataInicio && !!dataFim,
    });
}

export interface Anomalias {
    duplicatas: Array<{ cnpjEmitente: string; razaoSocial: string; dataEmissao: string; valorTotal: number; count: number; chaves: string[] }>;
    gaps: Array<{ cnpjEmitente: string; razaoSocial: string; serie: string; from: number; to: number; missing: number }>;
}

/** Anomalias fiscais: duplicatas prováveis + gaps de numeração (EPIC-26). */
export function useAnomalias() {
    return useQuery({ queryKey: ['stats', 'anomalias'], queryFn: () => apiFetch<Anomalias>('/stats/anomalies') });
}

// ── Alertas proativos (EPIC-27) ──────────────────────────────────────
export type AlertType =
    | 'high_value' | 'supplier_concentration' | 'volume_spike' | 'zero_tax' | 'duplicate' | 'numbering_gap';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    refs: { chaves?: string[]; cnpjEmitente?: string; serie?: string };
    data: Record<string, number | string>;
    read: boolean;
    createdAt: string;
}

/** Lista de alertas (mais severos e recentes primeiro). */
export function useAlerts(params: { read?: boolean; severity?: AlertSeverity } = {}) {
    return useQuery({
        queryKey: ['alerts', params],
        queryFn: () => apiFetch<{ alerts: Alert[] }>(`/alerts${qs({ read: params.read, severity: params.severity })}`),
    });
}

/** Contagem de não-lidos, com polling (badge do sino). */
export function useAlertCount() {
    return useQuery({
        queryKey: ['alerts', 'count'],
        queryFn: () => apiFetch<{ unread: number }>('/alerts/count'),
        refetchInterval: 30_000,
    });
}

/** Marca um alerta como lido/não-lido e invalida lista + contagem. */
export function useMarkAlertRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: string; read?: boolean }) =>
            apiFetch(`/alerts/${vars.id}`, { method: 'PATCH', body: { read: vars.read ?? true } }),
        onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

/** Marca todos os alertas como lidos. */
export function useMarkAllAlertsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => apiFetch('/alerts/read-all', { method: 'POST' }),
        onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

/** Dispara a reavaliação das regras (persiste os alertas) e invalida a lista. */
export function useEvaluateAlerts() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => apiFetch<{ evaluated: number; stored: number }>('/alerts/evaluate', { method: 'POST' }),
        onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

export interface AlertConfig {
    highValue: { enabled: boolean; threshold: number };
    supplierConcentration: { enabled: boolean; threshold: number };
    volumeSpike: { enabled: boolean; threshold: number };
    zeroTax: { enabled: boolean };
    duplicate: { enabled: boolean };
    numberingGap: { enabled: boolean };
}

/** Configuração global das regras de alerta. */
export function useAlertConfig() {
    return useQuery({
        queryKey: ['alerts', 'config'],
        queryFn: () => apiFetch<{ config: AlertConfig }>('/alerts/config'),
    });
}

/** Salva a configuração global das regras. */
export function useSaveAlertConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (config: Partial<AlertConfig>) =>
            apiFetch<{ config: AlertConfig }>('/alerts/config', { method: 'PUT', body: config }),
        onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

export function useTopCompanies() {
    return useQuery({
        queryKey: ['stats', 'top-empresas'],
        queryFn: () => apiFetch<{ ranking: TopEmpresa[] }>('/stats/top-empresas?metrica=valor&limit=50'),
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
        queryFn: () => apiFetch<{ tipo: string; porUf: UfStat[] }>(`/stats/by-uf${qs({ tipo })}`),
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
        queryFn: () => apiFetch<{ chaveAcesso: string; eventos: NFEvento[] }>(`/nf/${chave}/events`),
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
        queryFn: () => apiFetch<{ ranking: Array<Record<string, unknown>> }>('/stats/top-produtos?limit=50'),
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
    totais: { vICMS: number; vICMSST: number; vIPI: number; vPIS: number; vCOFINS: number; vII: number; vFCP: number; vIBS: number; vIBSUF: number; vIBSMun: number; vCBS: number; vIS: number };
    serie: Array<{ periodo: string; vICMS: number; vIPI: number; vPIS: number; vCOFINS: number; vIBS: number; vCBS: number; vIS: number }>;
    transicao: { comReforma: number; total: number };
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
        queryFn: () => apiFetch<{ arestas: FluxoAresta[]; limite: number }>(`/stats/flow${qs({ limite })}`),
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

export function useRede(limite = 150, period?: { dataInicio?: string; dataFim?: string }) {
    return useQuery({
        queryKey: ['stats', 'rede', limite, period?.dataInicio, period?.dataFim],
        queryFn: () =>
            apiFetch<{ nos: RedeNo[]; arestas: RedeAresta[]; limite: number }>(
                `/stats/network${qs({ limite, dataInicio: period?.dataInicio, dataFim: period?.dataFim })}`,
            ),
    });
}

// ── Grafo rico: centralidade e comunidades (EPIC-28) ─────────────────
export interface CentralityNode {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    degree: number;
    totalNFs: number;
    valorTotal: number;
}

/** Ranking de empresas-hub por centralidade de grau. */
export function useCentrality(limit = 50) {
    return useQuery({
        queryKey: ['stats', 'centrality', limit],
        queryFn: () => apiFetch<{ ranking: CentralityNode[] }>(`/stats/centrality${qs({ limit })}`),
    });
}

export interface Community {
    id: string;
    members: string[];
    size: number;
}

/** Comunidades (clusters de empresas que transacionam entre si). */
export function useCommunities() {
    return useQuery({
        queryKey: ['stats', 'communities'],
        queryFn: () => apiFetch<{ communities: Community[] }>('/stats/communities'),
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
        queryFn: () => apiFetch<{ eventos: EventoGlobal[]; total: number }>(`/stats/events${qs(params)}`),
    });
}
