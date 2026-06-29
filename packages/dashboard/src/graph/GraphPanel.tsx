import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import type { NodeData } from './layout.js';

/** Painel lateral universal de detalhes de um nó (Empresa/NF/Produto). */
export function GraphPanel({ node, onClose }: { node: NodeData; onClose: () => void }): JSX.Element {
    const { t } = useTranslation();
    const details = (node.detalhes ?? {}) as Record<string, unknown>;

    return (
        <aside className="graph-panel">
            <button type="button" className="graph-panel__close" aria-label={t('comum.cancelar')} onClick={onClose}>
                ✕
            </button>
            <h3>{node.label}</h3>
            {node.tipo === 'empresa' && (
                <dl>
                    <dt>{t('empresas.cnpj')}</dt><dd>{node.cnpj}</dd>
                    <dt>{t('empresas.razaoSocial')}</dt><dd>{String(details.razaoSocial ?? '—')}</dd>
                    <dt>{t('empresas.uf')}</dt><dd>{String(details.uf ?? '—')}</dd>
                    <dt>{t('empresas.nfsEmitidas')}</dt><dd>{String(details.totalNFs ?? 0)}</dd>
                    {node.cnpj && (
                        <dd>
                            <Link to={'/nf' as string} search={{ cnpjEmitente: node.cnpj } as never}>{t('nf.detalheTitulo')}</Link>
                        </dd>
                    )}
                </dl>
            )}
        </aside>
    );
}
