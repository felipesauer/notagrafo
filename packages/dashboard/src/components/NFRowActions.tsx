import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Download, Eye, Waypoints } from 'lucide-react';
import { downloadFile } from '../api/api.client.js';
import { Button } from './ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

/**
 * Ações inline de uma linha de NF-e (ver detalhe / baixar XML / abrir no grafo),
 * padrão único do dashboard — antes duplicado em ExplorerNotas e Overview.
 *
 * - `chave`: chave de acesso da NF (para baixar XML e navegar ao detalhe).
 * - `cnpjEmitente`: se presente, mostra o atalho para o grafo da empresa.
 * - `onView`: se fornecido, o "ver" chama esse handler (ex.: abrir o Peek in-place);
 *   se ausente, o "ver" navega para a página de detalhe (/nf/$chave).
 *
 * O container faz `stopPropagation` para não disparar o clique da linha (que
 * abre o peek/detalhe) ao usar as ações.
 */
export function NFRowActions({ chave, cnpjEmitente, onView }: { chave: string; cnpjEmitente?: string; onView?: () => void }): JSX.Element {
    const { t } = useTranslation();
    const stop = (e: React.MouseEvent): void => e.stopPropagation();
    return (
        <div className="flex items-center justify-end gap-0.5" onClick={stop}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {onView ? (
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={t('nf.verDetalhe')} onClick={onView}><Eye /></Button>
                    ) : (
                        <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={t('nf.verDetalhe')}>
                            <Link to={'/invoice/$chave' as string} params={{ chave } as never}><Eye /></Link>
                        </Button>
                    )}
                </TooltipTrigger>
                <TooltipContent>{t('nf.verDetalhe')}</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t('nf.baixarXml')} onClick={() => void downloadFile(`/nf/${chave}/xml`, `${chave}.xml`)}><Download /></Button>
                </TooltipTrigger>
                <TooltipContent>{t('nf.baixarXml')}</TooltipContent>
            </Tooltip>
            {cnpjEmitente && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={t('nf.abrirGrafo')}>
                            <Link to={'/graph' as string} search={{ cnpj: cnpjEmitente } as never}><Waypoints /></Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('nf.abrirGrafo')}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
