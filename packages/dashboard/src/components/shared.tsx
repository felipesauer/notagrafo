import { Component, type ErrorInfo, type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { maskCpfIf, isCpf } from '@notagrafo/core';
import { isCpfMaskingEnabled } from '../lib/lgpd-config.js';

/** Badge colorido do status da NF. */
export function NFStatusBadge({ status }: { status: string }): JSX.Element {
    const cores: Record<string, string> = {
        ativa: '#16a34a',
        cancelada: '#dc2626',
        denegada: '#d97706',
        inutilizada: '#6b7280',
    };
    return (
        <span className="badge" style={{ background: cores[status] ?? '#6b7280' }}>
            {status}
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
        return <span className="cnpj">{f}</span>;
    }
    // Possível CPF de MEI (11 dígitos): aplica o mascaramento LGPD quando ativo.
    const valor = isCpf(cnpj) ? maskCpfIf(isCpfMaskingEnabled(), cnpj) : cnpj;
    return <span className="cnpj">{valor}</span>;
}

/** Valor monetário em BRL. */
export function CurrencyValue({ value }: { value: number }): JSX.Element {
    return <span className="currency">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>;
}

/** Data/hora ISO formatada para pt-BR. */
export function DateDisplay({ value }: { value: string | null | undefined }): JSX.Element {
    if (!value) return <span>—</span>;
    const d = new Date(value);
    return <span>{Number.isNaN(d.getTime()) ? value : d.toLocaleString('pt-BR')}</span>;
}

/** Estado vazio com mensagem. */
export function EmptyState({ mensagem }: { mensagem?: string }): JSX.Element {
    const { t } = useTranslation();
    return <div className="empty-state">{mensagem ?? t('comum.vazio')}</div>;
}

/** Skeleton de carregamento (n linhas). */
export function LoadingSkeleton({ linhas = 3 }: { linhas?: number }): JSX.Element {
    return (
        <div className="skeleton" aria-busy="true" aria-live="polite">
            {Array.from({ length: linhas }).map((_, i) => (
                <div key={i} className="skeleton__row" />
            ))}
        </div>
    );
}

/** Erro inline com botão "tentar novamente". */
export function InlineError({ onRetry }: { onRetry?: () => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div role="alert" className="inline-error">
            <span>{t('comum.erro')}</span>
            {onRetry && (
                <button type="button" onClick={onRetry}>
                    {t('comum.tentarNovamente')}
                </button>
            )}
        </div>
    );
}

interface ErrorBoundaryState {
    erro: boolean;
}

/** ErrorBoundary global para isolar falhas de render. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
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
                <div role="alert" className="inline-error">
                    Algo deu errado. Recarregue a página.
                </div>
            );
        }
        return this.props.children;
    }
}
