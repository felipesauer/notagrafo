import { Component, type ErrorInfo, type JSX, type ReactNode, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, CheckCircle2, XCircle, AlertTriangle, Ban, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { maskCpfIf, isCpf } from '@notagrafo/core/lgpd';
import { isCpfMaskingEnabled } from '../lib/lgpd-config.js';
import { statusColor, statusBg } from '../lib/status.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';

/**
 * Ícone por status — a11y: nunca comunicar status só por cor (NOTA-ADR-13). O
 * ícone acompanha a cor+texto na pill, para leitura sem depender de matiz.
 * Status de export reusam a semântica: ready→check, failed→x, queued→alerta.
 */
const STATUS_ICON: Record<string, LucideIcon> = {
    ativa: CheckCircle2,
    ready: CheckCircle2,
    cancelada: XCircle,
    failed: XCircle,
    denegada: AlertTriangle,
    queued: AlertTriangle,
    inutilizada: Ban,
    processing: Ban,
};

/**
 * Badge de status de NF ou de exportação, no formato pill (redesign BI vibrante):
 * cor de texto/ícone + fundo tonal suave (lib/status.ts, CSS vars que respondem ao
 * tema) + ícone semântico. O data-testid é usado pelos e2e. Texto renderizado cru
 * (o back-end já entrega o rótulo do domínio).
 */
export function NFStatusBadge({ status }: { status: string }): JSX.Element {
    const Icon = STATUS_ICON[status] ?? Ban;
    return (
        <span
            className="inline-flex w-fit items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-xs font-semibold capitalize"
            data-testid="status-badge"
            style={{ color: statusColor(status), background: statusBg(status) }}
        >
            <Icon className="size-3" aria-hidden />
            {status}
        </span>
    );
}

/**
 * Chave de acesso da NF-e (44 dígitos) truncada, com botão de copiar a chave
 * completa. Feedback via toast (sonner) + ícone Check por 2s.
 */
export function CopyableKey({ chave, truncate = true }: { chave: string; truncate?: boolean }): JSX.Element {
    const { t } = useTranslation();
    const [copiado, setCopiado] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const exibido = truncate && chave.length > 16 ? `${chave.slice(0, 8)}…${chave.slice(-6)}` : chave;

    // Limpa o timer pendente ao desmontar (evita setState em componente morto).
    useEffect(() => () => clearTimeout(timerRef.current), []);

    function copiar(): void {
        const p = navigator.clipboard?.writeText(chave);
        if (!p) return; // Clipboard API indisponível (contexto não-seguro): no-op.
        void p.then(() => {
            setCopiado(true);
            toast.success(t('nf.copiado'));
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopiado(false), 2000);
        });
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <code className="font-mono text-xs" title={chave}>{exibido}</code>
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={copiar}
                aria-label={t('nf.copiar')}
                title={t('nf.copiar')}
            >
                {copiado ? <Check className="text-status-ativa" /> : <Copy />}
            </Button>
        </span>
    );
}

/**
 * CNPJ formatado (00.000.000/0000-00). Se o valor for na verdade um CPF de MEI
 * (11 dígitos) e o mascaramento LGPD estiver ativo, exibe-o pseudonimizado.
 */
export function CNPJText({ cnpj }: { cnpj: string }): JSX.Element {
    if (cnpj.length === 14) {
        const f = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        return <span className="font-mono text-xs tabular-nums">{f}</span>;
    }
    // Possível CPF de MEI (11 dígitos): aplica o mascaramento LGPD quando ativo.
    const valor = isCpf(cnpj) ? maskCpfIf(isCpfMaskingEnabled(), cnpj) : cnpj;
    return <span className="font-mono text-xs tabular-nums">{valor}</span>;
}

/** Valor monetário em BRL. */
export function CurrencyValue({ value }: { value: number }): JSX.Element {
    return <span className="tabular-nums">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>;
}

/** Data/hora ISO formatada para pt-BR. */
export function DateDisplay({ value }: { value: string | null | undefined }): JSX.Element {
    if (!value) return <span className="text-muted-foreground">—</span>;
    const d = new Date(value);
    return <span className="tabular-nums">{Number.isNaN(d.getTime()) ? value : d.toLocaleString('pt-BR')}</span>;
}

/** Estado vazio com mensagem e ação opcional. */
export function EmptyState({ mensagem, action }: { mensagem?: string; action?: ReactNode }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{mensagem ?? t('comum.vazio')}</p>
            {action}
        </div>
    );
}

type SkeletonVariant = 'table' | 'kpis' | 'card' | 'lines';

/**
 * Skeleton de carregamento com variantes fiéis ao layout real. `linhas` é o
 * número de linhas (table/lines) ou de cards (kpis). Mantém aria-busy/live.
 */
export function LoadingSkeleton({
    variant = 'lines',
    linhas = 3,
    colunas = 5,
}: {
    variant?: SkeletonVariant;
    linhas?: number;
    colunas?: number;
}): JSX.Element {
    return (
        <div aria-busy="true" aria-live="polite">
            {variant === 'kpis' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: linhas }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            )}
            {variant === 'card' && <Skeleton className="h-64 w-full rounded-xl" />}
            {variant === 'lines' &&
                Array.from({ length: linhas }).map((_, i) => (
                    <Skeleton key={i} className="mb-2 h-6 w-full" />
                ))}
            {variant === 'table' && (
                <div className="space-y-2">
                    <div className="flex gap-3">
                        {Array.from({ length: colunas }).map((_, i) => (
                            <Skeleton key={i} className="h-5 flex-1" />
                        ))}
                    </div>
                    {Array.from({ length: linhas }).map((_, r) => (
                        <div key={r} className="flex gap-3">
                            {Array.from({ length: colunas }).map((_, c) => (
                                <Skeleton key={c} className="h-8 flex-1" />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Erro inline com botão "tentar novamente". */
export function InlineError({ onRetry }: { onRetry?: () => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div role="alert" className="flex items-center gap-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{t('comum.erro')}</span>
            {onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    {t('comum.tentarNovamente')}
                </Button>
            )}
        </div>
    );
}

interface ErrorBoundaryState {
    erro: boolean;
}

/** ErrorBoundary global para isolar falhas de render. */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { erro: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { erro: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary:', error, info.componentStack);
    }

    override render(): ReactNode {
        if (this.state.erro) {
            return (
                this.props.fallback ?? (
                    <div role="alert" className="m-8 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Algo deu errado. Recarregue a página.
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
