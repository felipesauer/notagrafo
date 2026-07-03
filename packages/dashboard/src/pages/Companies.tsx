import { type JSX, Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, Network } from 'lucide-react';
import { useTopCompanies, useCompany } from '../api/hooks.js';
import { CNPJText, LoadingSkeleton, InlineError, EmptyState } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { SortableHead } from '../components/SortableHead.js';
import { useTableSort } from '../hooks/useTableSort.js';
import { Card } from '../components/ui/card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Button } from '../components/ui/button.js';

/** Card de detalhes inline de uma empresa (expandido na tabela). */
function CompanyCard({ cnpj }: { cnpj: string }): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading } = useCompany(cnpj);
    if (isLoading) return <LoadingSkeleton linhas={2} />;
    const e = data as (Record<string, unknown> & { stats?: { totalNFsEmitidas?: number; totalNFsRecebidas?: number } }) | undefined;
    return (
        <div data-testid="inline-card" className="flex flex-wrap items-center gap-6 rounded-md bg-muted/40 px-4 py-3 text-sm">
            <span><span className="text-muted-foreground">{t('empresas.nfsEmitidas')}:</span> <strong className="tabular-nums">{e?.stats?.totalNFsEmitidas ?? 0}</strong></span>
            <span><span className="text-muted-foreground">{t('empresas.nfsRecebidas')}:</span> <strong className="tabular-nums">{e?.stats?.totalNFsRecebidas ?? 0}</strong></span>
            <Button asChild variant="link" size="sm" className="ml-auto h-auto p-0">
                <Link to={'/grafo' as string} search={{ cnpj } as never}><Network /> {t('empresas.verGrafo')}</Link>
            </Button>
        </div>
    );
}

export function CompaniesPage(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useTopCompanies();
    const [expandida, setExpandida] = useState<string | null>(null);

    const ranking = data?.ranking ?? [];
    const { sorted, toggle, ariaSort } = useTableSort(ranking, {
        razaoSocial: (e) => e.razaoSocial,
        uf: (e) => e.uf,
        totalNFs: (e) => e.totalNFs,
    });

    if (isLoading) return <div><PageHeader title={t('empresas.titulo')} /><LoadingSkeleton variant="table" linhas={6} colunas={4} /></div>;
    if (isError || !data) return <div><PageHeader title={t('empresas.titulo')} /><InlineError onRetry={() => void refetch()} /></div>;
    if (ranking.length === 0) return <div><PageHeader title={t('empresas.titulo')} /><EmptyState /></div>;

    return (
        <div>
            {/* h2 do PageHeader — companies.spec usa heading level 2 */}
            <PageHeader title={t('empresas.titulo')} />
            <Card className="overflow-hidden py-0">
                <div className="overflow-x-auto">
                <Table data-testid="data-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8" />
                            <SortableHead ariaSort={ariaSort('razaoSocial')} onToggle={() => toggle('razaoSocial')}>{t('empresas.razaoSocial')}</SortableHead>
                            <TableHead>{t('empresas.cnpj')}</TableHead>
                            <SortableHead ariaSort={ariaSort('uf')} onToggle={() => toggle('uf')}>{t('empresas.uf')}</SortableHead>
                            <SortableHead ariaSort={ariaSort('totalNFs')} onToggle={() => toggle('totalNFs')} align="right">{t('empresas.nfsEmitidas')}</SortableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((e) => {
                            const aberta = expandida === e.cnpj;
                            return (
                                <Fragment key={e.cnpj}>
                                    <TableRow className="cursor-pointer" onClick={() => setExpandida(aberta ? null : e.cnpj)}>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-expanded={aberta}
                                                aria-label={aberta ? t('comum.fechar') : t('empresas.verGrafo')}
                                                onClick={(ev) => { ev.stopPropagation(); setExpandida(aberta ? null : e.cnpj); }}
                                            >
                                                {aberta ? <ChevronDown /> : <ChevronRight />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                                        <TableCell><CNPJText cnpj={e.cnpj} /></TableCell>
                                        <TableCell>{e.uf}</TableCell>
                                        <TableCell className="text-right tabular-nums">{e.totalNFs}</TableCell>
                                    </TableRow>
                                    {aberta && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="p-2"><CompanyCard cnpj={e.cnpj} /></TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
                </div>
            </Card>
        </div>
    );
}
