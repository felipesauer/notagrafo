import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';
import type { NodeData } from './layout.js';
import { Button } from '../components/ui/button.js';

/** Item de definição (rótulo + valor) do painel. */
function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

/** Painel lateral universal de detalhes de um nó (Empresa/NF/Produto). */
export function GraphPanel({ node, onClose }: { node: NodeData; onClose: () => void }): JSX.Element {
    const { t } = useTranslation();
    const details = (node.detalhes ?? {}) as Record<string, unknown>;

    return (
        <aside className="absolute right-0 top-0 bottom-0 z-10 w-72 overflow-y-auto border-l bg-card p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{node.label}</h3>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={t('comum.fechar')} onClick={onClose}>
                    <X />
                </Button>
            </div>
            {node.tipo === 'empresa' && (
                <dl className="grid gap-3">
                    <Field label={t('empresas.cnpj')}><span className="font-mono text-xs">{node.cnpj}</span></Field>
                    <Field label={t('empresas.razaoSocial')}>{String(details.razaoSocial ?? '—')}</Field>
                    <Field label={t('empresas.uf')}>{String(details.uf ?? '—')}</Field>
                    <Field label={t('empresas.nfsEmitidas')}><span className="tabular-nums">{String(details.totalNFs ?? 0)}</span></Field>
                    {node.cnpj && (
                        <div className="mt-1 grid gap-1">
                            <Button asChild variant="outline" size="sm">
                                <Link to={'/nf' as string} search={{ cnpjEmitente: node.cnpj } as never}>{t('nf.detalheTitulo')}</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link to={'/nf' as string} search={{ cnpjEmitente: node.cnpj, comImposto: true } as never}>{t('grafo.nfsComImposto')}</Link>
                            </Button>
                        </div>
                    )}
                </dl>
            )}
            {node.tipo === 'produto' && (
                <dl className="grid gap-3">
                    <Field label={t('produtos.descricao')}>{String(details.descricao ?? node.label)}</Field>
                    <Field label={t('nf.ncm')}><span className="tabular-nums">{String(details.ncm ?? '—')}</span></Field>
                    <Field label={t('produtos.totalNFs')}><span className="tabular-nums">{String(details.totalNFs ?? 0)}</span></Field>
                    <Field label={t('produtos.valorTotal')}>
                        <span className="tabular-nums">{Number(details.valorTotal ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </Field>
                    {details.ncm ? (
                        <Button asChild variant="outline" size="sm" className="mt-1">
                            <Link to={'/nf' as string} search={{ ncm: String(details.ncm) } as never}>{t('grafo.nfsDoNcm')}</Link>
                        </Button>
                    ) : null}
                </dl>
            )}
        </aside>
    );
}
