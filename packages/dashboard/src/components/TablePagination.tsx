import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button.js';
import { NativeSelect } from './ui/native-select.js';

/** Opções de linhas por página oferecidas no seletor. */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

/**
 * Rodapé de paginação padrão das tabelas: seletor de linhas por página +
 * indicador "X–Y de Z" + Anterior/Próxima. Agnóstico à fonte (client ou
 * server): quem usa controla `page`, `pageSize` e o total via callbacks.
 *
 * - `total`: total conhecido de itens (para o intervalo). Se desconhecido
 *   (paginação por cursor sem contagem), passe `undefined` e o intervalo some.
 * - `hasNext`/`hasPrev`: habilitam os botões (na paginação por cursor, derivam
 *   do nextCursor; na client-side, de page/total).
 */
export function TablePagination({
    page,
    pageSize,
    total,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onPageSize,
}: {
    page: number; // 0-based
    pageSize: number;
    total?: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onPageSize: (n: number) => void;
}): JSX.Element {
    const { t } = useTranslation();
    const from = total === 0 ? 0 : page * pageSize + 1;
    const to = total === undefined ? (page + 1) * pageSize : Math.min((page + 1) * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
                <NativeSelect
                    value={String(pageSize)}
                    onChange={(e) => onPageSize(Number(e.target.value))}
                    wrapperClassName="w-[76px]"
                    className="h-7 text-xs"
                    aria-label={t('comum.paginacao.porPagina')}
                >
                    {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </NativeSelect>
                <span>{t('comum.paginacao.porPagina')}</span>
            </label>
            <div className="flex items-center gap-3">
                {total !== undefined && (
                    <span className="tabular-nums">{t('comum.paginacao.intervalo', { from, to, total })}</span>
                )}
                <div className="flex gap-1">
                    <Button type="button" variant="outline" size="icon-sm" disabled={!hasPrev} onClick={onPrev} aria-label={t('comum.paginacao.anterior')}>
                        <ChevronLeft />
                    </Button>
                    <Button type="button" variant="outline" size="icon-sm" disabled={!hasNext} onClick={onNext} aria-label={t('comum.paginacao.proxima')}>
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
