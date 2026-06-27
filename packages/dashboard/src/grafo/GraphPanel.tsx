import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import type { DadosNo } from './layout.js';

/** Painel lateral universal de detalhes de um nó (Empresa/NF/Produto). */
export function GraphPanel({ no, onClose }: { no: DadosNo; onClose: () => void }): JSX.Element {
    const { t } = useTranslation();
    const det = (no.detalhes ?? {}) as Record<string, unknown>;

    return (
        <aside className="graph-panel">
            <button type="button" className="graph-panel__close" aria-label={t('comum.cancelar')} onClick={onClose}>
                ✕
            </button>
            <h3>{no.label}</h3>
            {no.tipo === 'empresa' && (
                <dl>
                    <dt>{t('empresas.cnpj')}</dt><dd>{no.cnpj}</dd>
                    <dt>{t('empresas.razaoSocial')}</dt><dd>{String(det.razaoSocial ?? '—')}</dd>
                    <dt>{t('empresas.uf')}</dt><dd>{String(det.uf ?? '—')}</dd>
                    <dt>{t('empresas.nfsEmitidas')}</dt><dd>{String(det.totalNFs ?? 0)}</dd>
                    {no.cnpj && (
                        <dd>
                            <Link to={'/nf' as string} search={{ cnpjEmitente: no.cnpj } as never}>{t('nf.detalheTitulo')}</Link>
                        </dd>
                    )}
                </dl>
            )}
        </aside>
    );
}
