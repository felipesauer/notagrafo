import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store.js';
import { LoadingSkeleton, InlineError } from '../components/shared.js';

interface Health {
    status: string;
    services: Record<string, string>;
    xsdVersions: string[];
    uptime: number;
}

async function fetchHealth(): Promise<Health> {
    const res = await fetch('/health');
    return (await res.json()) as Health;
}

export function ConfiguracoesPage(): JSX.Element {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

    return (
        <div className="configuracoes">
            <section className="config-section">
                <h2>{t('config.perfil')}</h2>
                <p>{user?.nome ?? '—'} — {user?.email ?? '—'}</p>
                <button type="button" disabled>{t('config.alterarSenha')}</button>
            </section>

            <section className="config-section">
                <h2>{t('config.usuarios')}</h2>
                <table className="data-table">
                    <thead><tr><th>{t('login.email')}</th></tr></thead>
                    <tbody><tr><td>{user?.email ?? '—'}</td></tr></tbody>
                </table>
                <button type="button" disabled>{t('config.convidar')}</button>
            </section>

            <section className="config-section">
                <h2>{t('config.armazenamento')}</h2>
                <p>{t('config.driver')}: <code>minio</code></p>
            </section>

            <section className="config-section">
                <h2>{t('config.sistema')}</h2>
                {health.isLoading && <LoadingSkeleton linhas={2} />}
                {health.isError && <InlineError onRetry={() => void health.refetch()} />}
                {health.data && (
                    <dl>
                        <dt>{t('config.xsdVersions')}</dt>
                        <dd>{health.data.xsdVersions.join(', ')}</dd>
                        <dt>{t('config.servicos')}</dt>
                        <dd>
                            {Object.entries(health.data.services).map(([nome, st]) => (
                                <span key={nome} className="service-status">
                                    {st === 'ok' ? '🟢' : '🔴'} {nome}
                                </span>
                            ))}
                        </dd>
                        <dt>{t('config.uptime')}</dt>
                        <dd>{health.data.uptime}s</dd>
                    </dl>
                )}
                <button type="button" onClick={() => void health.refetch()}>{t('config.verificarSaude')}</button>
            </section>
        </div>
    );
}
