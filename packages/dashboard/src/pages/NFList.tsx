import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { useNFList } from '../api/hooks.js';
import { NFStatusBadge, CNPJText, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { UploadModal } from '../components/UploadModal.js';
import { FilterSidebar, type NFFiltros } from '../components/FilterSidebar.js';

/** Página de listagem de NFs: toolbar + FilterSidebar + tabela com paginação cursor. */
export function NFListPage(): JSX.Element {
    const { t } = useTranslation();
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [filtros, setFiltros] = useState<NFFiltros>({}); // filtros avançados da sidebar
    const [cursores, setCursores] = useState<string[]>([]); // pilha de cursores (páginas)
    const [modalAberto, setModalAberto] = useState(false);

    const cursorAtual = cursores[cursores.length - 1];
    const query = useNFList({
        limit: 20,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
        ...filtros,
        ...(cursorAtual ? { cursor: cursorAtual } : {}),
    });

    function aplicarFiltro(novoStatus: string, novoQ: string): void {
        setCursores([]); // reset paginação ao filtrar
        setStatus(novoStatus);
        setQ(novoQ);
    }

    function aplicarSidebar(novosFiltros: NFFiltros): void {
        setCursores([]); // reset paginação ao filtrar
        setFiltros(novosFiltros);
    }

    return (
        <div className="nf-list nf-list--with-sidebar">
            <FilterSidebar valor={filtros} onAplicar={aplicarSidebar} />
            <div className="nf-list__main">
            <div className="toolbar">
                <input placeholder={t('comum.buscar')} value={q} onChange={(e) => aplicarFiltro(status, e.target.value)} />
                <select value={status} onChange={(e) => aplicarFiltro(e.target.value, q)}>
                    <option value="">{t('nf.todosStatus')}</option>
                    <option value="ativa">ativa</option>
                    <option value="cancelada">cancelada</option>
                    <option value="denegada">denegada</option>
                    <option value="inutilizada">inutilizada</option>
                </select>
                <button type="button" onClick={() => setModalAberto(true)}>{t('nf.uploadTitulo')}</button>
            </div>

            {query.isLoading && <LoadingSkeleton linhas={6} />}
            {query.isError && <InlineError onRetry={() => void query.refetch()} />}
            {query.data && query.data.data.length === 0 && <EmptyState />}

            {query.data && query.data.data.length > 0 && (
                <>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('nf.numero')}</th>
                                <th>{t('nf.emitente')}</th>
                                <th>{t('nf.valor')}</th>
                                <th>{t('nf.status')}</th>
                                <th>{t('nf.emissao')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.data.data.map((nf) => (
                                <tr key={nf.chaveAcesso}>
                                    <td><Link to={'/nf/$chave' as string} params={{ chave: nf.chaveAcesso } as never}>{nf.numero}</Link></td>
                                    <td>{nf.emitente ? <CNPJText cnpj={nf.emitente.cnpj} /> : '—'}</td>
                                    <td><CurrencyValue value={nf.valorTotal} /></td>
                                    <td><NFStatusBadge status={nf.status} /></td>
                                    <td><DateDisplay value={nf.dataEmissao} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button type="button" disabled={cursores.length === 0} onClick={() => setCursores((c) => c.slice(0, -1))}>
                            {t('nf.anterior')}
                        </button>
                        <button type="button" disabled={!query.data.pagination.hasMore} onClick={() => setCursores((c) => [...c, query.data!.pagination.nextCursor!])}>
                            {t('nf.proxima')}
                        </button>
                    </div>
                </>
            )}

            {modalAberto && <UploadModal onClose={() => setModalAberto(false)} onUploaded={() => void query.refetch()} />}
            </div>
        </div>
    );
}
