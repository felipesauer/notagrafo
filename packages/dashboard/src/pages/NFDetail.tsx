import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from '@tanstack/react-router';
import { useNFDetail } from '../api/hooks.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';

interface Item {
    numeroItem?: number;
    quantidade?: number;
    valorTotal?: number;
    produto?: { descricao?: string; codigo?: string };
}

/** Detalhe de uma NF em duas colunas: dados/itens + mini-grafo (seção 5). */
export function NFDetailPage(): JSX.Element {
    const { t } = useTranslation();
    const { chave } = useParams({ strict: false }) as { chave: string };
    const { data, isLoading, isError, refetch } = useNFDetail(chave);

    if (isLoading) return <LoadingSkeleton linhas={6} />;
    if (isError || !data) return <InlineError onRetry={() => void refetch()} />;

    const nf = data as Record<string, unknown> & {
        numero?: string;
        status?: string;
        valorTotal?: number;
        dataEmissao?: string;
        emitente?: { razaoSocial?: string; cnpj?: string };
        destinatario?: { razaoSocial?: string; cnpj?: string };
        itens?: Item[];
    };
    const itens = nf.itens ?? [];

    return (
        <div className="nf-detail">
            <div className="nf-detail__col">
                <h2>{t('nf.detalheTitulo')} {nf.numero}</h2>
                <dl>
                    <dt>{t('nf.status')}</dt><dd><NFStatusBadge status={nf.status ?? 'ativa'} /></dd>
                    <dt>{t('nf.valor')}</dt><dd><CurrencyValue value={nf.valorTotal ?? 0} /></dd>
                    <dt>{t('nf.emissao')}</dt><dd><DateDisplay value={nf.dataEmissao} /></dd>
                    <dt>{t('nf.emitente')}</dt><dd>{nf.emitente?.razaoSocial ?? '—'}</dd>
                    <dt>{t('nf.destinatario')}</dt><dd>{nf.destinatario?.razaoSocial ?? '—'}</dd>
                </dl>

                <h3>{t('nf.itens')}</h3>
                <table className="data-table">
                    <thead>
                        <tr><th>#</th><th>{t('nf.produto')}</th><th>{t('nf.qtd')}</th><th>{t('nf.valor')}</th></tr>
                    </thead>
                    <tbody>
                        {itens.map((item, i) => (
                            <tr key={i}>
                                <td>{item.numeroItem ?? i + 1}</td>
                                <td>{item.produto?.descricao ?? '—'}</td>
                                <td>{item.quantidade ?? 0}</td>
                                <td><CurrencyValue value={item.valorTotal ?? 0} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <aside className="nf-detail__grafo">
                <h3>{t('nf.miniGrafo')}</h3>
                {nf.emitente?.cnpj && (
                    <Link to={'/grafo' as string} search={{ cnpj: nf.emitente.cnpj } as never}>
                        {t('nf.verNoGrafo')}
                    </Link>
                )}
            </aside>
        </div>
    );
}
