import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNFList, type NFListItem } from '../../api/hooks.js';
import { NFStatusBadge, CurrencyValue, DateDisplay, LoadingSkeleton, InlineError, EmptyState } from '../../components/shared.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.js';
import { NFPeek } from './NFPeek.js';

const cnpjFmt = (c: string): string =>
    c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

/** Parte (emitente/destinatário): razão social + CNPJ pequeno mono. */
function Parte({ p }: { p?: { cnpj: string; razaoSocial: string; uf: string } }): JSX.Element {
    if (!p) return <span className="text-muted-foreground">—</span>;
    return (
        <div className="flex flex-col leading-tight">
            <span className="truncate font-medium">{p.razaoSocial || '—'}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{cnpjFmt(p.cnpj)}{p.uf ? ` · ${p.uf}` : ''}</span>
        </div>
    );
}

/**
 * Explorador da entidade Notas fiscais: tabela densa (mono nos dados fiscais)
 * onde clicar numa linha abre o Peek lateral, navegável por ↑/↓ sem perder o
 * lugar. Peek é o drill-down primário; Enter/botão leva ao detalhe completo.
 */
export function ExplorerNotas({ q, status }: { q?: string; status?: string }): JSX.Element {
    const { t } = useTranslation();
    const query = useNFList({ limit: 50, orderBy: 'dataEmissao', order: 'desc', ...(q ? { q } : {}), ...(status ? { status } : {}) });
    const rows = query.data?.data ?? [];
    const [sel, setSel] = useState<number | null>(null);

    if (query.isLoading) return <LoadingSkeleton variant="table" linhas={10} colunas={6} />;
    if (query.isError) return <InlineError onRetry={() => void query.refetch()} />;
    if (rows.length === 0) return <EmptyState />;

    const selNf: NFListItem | null = sel != null ? (rows[sel] ?? null) : null;

    return (
        <>
            <div className="overflow-x-auto">
                <Table data-testid="data-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14">{t('nf.numero')}</TableHead>
                            <TableHead>{t('nf.chave')}</TableHead>
                            <TableHead>{t('nf.emitente')}</TableHead>
                            <TableHead>{t('nf.destinatario')}</TableHead>
                            <TableHead className="text-right">{t('nf.valor')}</TableHead>
                            <TableHead>{t('nf.status')}</TableHead>
                            <TableHead>{t('nf.emissao')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((nf, i) => (
                            <TableRow
                                key={nf.chaveAcesso}
                                data-i={i}
                                className={`cursor-pointer ${sel === i ? 'bg-primary/10 shadow-[inset_2px_0_0_var(--primary)]' : ''}`}
                                onClick={() => setSel(i)}
                            >
                                <TableCell className="font-mono font-medium tabular-nums">{nf.numero}</TableCell>
                                <TableCell className="font-mono text-[11px] text-muted-foreground">…{nf.chaveAcesso.slice(-8)}</TableCell>
                                <TableCell><Parte p={nf.emitente} /></TableCell>
                                <TableCell><Parte p={nf.destinatario} /></TableCell>
                                <TableCell className="text-right font-mono font-medium tabular-nums"><CurrencyValue value={nf.valorTotal} /></TableCell>
                                <TableCell><NFStatusBadge status={nf.status} /></TableCell>
                                <TableCell className="font-mono text-muted-foreground tabular-nums"><DateDisplay value={nf.dataEmissao} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <NFPeek
                nf={selNf}
                open={sel != null}
                onOpenChange={(o) => !o && setSel(null)}
                onPrev={() => setSel((s) => (s != null && s > 0 ? s - 1 : s))}
                onNext={() => setSel((s) => (s != null && s < rows.length - 1 ? s + 1 : s))}
                hasPrev={sel != null && sel > 0}
                hasNext={sel != null && sel < rows.length - 1}
            />
        </>
    );
}
