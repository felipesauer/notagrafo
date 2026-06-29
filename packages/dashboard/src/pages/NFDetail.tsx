import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from '@tanstack/react-router';
import { useNFDetail } from '../api/hooks.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError } from '../components/shared.js';

interface Tributos {
    vICMS?: number;
    vICMSST?: number;
    vFCP?: number;
    vIPI?: number;
    vPIS?: number;
    vCOFINS?: number;
    vII?: number;
    vISSQN?: number;
}

interface Item {
    numeroItem?: number;
    quantidade?: number;
    valorTotal?: number;
    produto?: { descricao?: string; codigo?: string; ncm?: { codigo?: string; descricao?: string } };
    tributos?: Tributos;
}

interface Totais {
    vNF?: number;
    vICMS?: number;
    vIPI?: number;
    vPIS?: number;
    vCOFINS?: number;
    vDesc?: number;
}

/** Valor monetário compacto para células de tabela (— quando ausente/zero). */
function Money({ value }: { value?: number }): JSX.Element {
    if (value === undefined || value === null) return <span>—</span>;
    return <span>{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

/** Detalhe de uma NF: dados + CFOP, itens com NCM e tributos, totais e mini-grafo. */
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
        cfop?: { codigo?: string; descricao?: string };
        itens?: Item[];
        totais?: Totais;
    };
    const itens = nf.itens ?? [];
    const totais = nf.totais ?? {};

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
                    {nf.cfop?.codigo && (
                        <>
                            <dt>{t('nf.cfop')}</dt>
                            <dd>{nf.cfop.codigo}{nf.cfop.descricao ? ` — ${nf.cfop.descricao}` : ''}</dd>
                        </>
                    )}
                </dl>

                <h3>{t('nf.itens')}</h3>
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t('nf.produto')}</th>
                                <th>{t('nf.ncm')}</th>
                                <th>{t('nf.qtd')}</th>
                                <th>{t('nf.valor')}</th>
                                <th>{t('nf.icms')}</th>
                                <th>{t('nf.ipi')}</th>
                                <th>{t('nf.pis')}</th>
                                <th>{t('nf.cofins')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.numeroItem ?? i + 1}</td>
                                    <td>{item.produto?.descricao ?? '—'}</td>
                                    <td title={item.produto?.ncm?.descricao ?? ''}>{item.produto?.ncm?.codigo ?? '—'}</td>
                                    <td>{item.quantidade ?? 0}</td>
                                    <td><CurrencyValue value={item.valorTotal ?? 0} /></td>
                                    <td><Money value={item.tributos?.vICMS} /></td>
                                    <td><Money value={item.tributos?.vIPI} /></td>
                                    <td><Money value={item.tributos?.vPIS} /></td>
                                    <td><Money value={item.tributos?.vCOFINS} /></td>
                                </tr>
                            ))}
                        </tbody>
                        {(totais.vNF !== undefined || totais.vICMS !== undefined) && (
                            <tfoot>
                                <tr className="data-table__totais">
                                    <td colSpan={5}>{t('nf.totais')} ({t('nf.valorNF')}: <CurrencyValue value={totais.vNF ?? nf.valorTotal ?? 0} />)</td>
                                    <td><Money value={totais.vICMS} /></td>
                                    <td><Money value={totais.vIPI} /></td>
                                    <td><Money value={totais.vPIS} /></td>
                                    <td><Money value={totais.vCOFINS} /></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
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
