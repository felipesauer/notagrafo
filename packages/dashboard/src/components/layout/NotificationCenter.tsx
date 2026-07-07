import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
    AlertTriangle, Bell, CheckCheck, CopyCheck, DollarSign, Hash, RefreshCw, ShieldCheck, TrendingUp,
} from 'lucide-react';
import {
    useAlerts, useAlertCount, useMarkAlertRead, useMarkAllAlertsRead, useEvaluateAlerts,
    type Alert, type AlertSeverity, type AlertType,
} from '../../api/hooks.js';
import { Button } from '../ui/button.js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.js';
import { ScrollArea } from '../ui/scroll-area.js';

const ICONS: Record<AlertType, typeof Bell> = {
    high_value: DollarSign,
    supplier_concentration: AlertTriangle,
    volume_spike: TrendingUp,
    zero_tax: AlertTriangle,
    duplicate: CopyCheck,
    numbering_gap: Hash,
};

const SEVERITY_TONE: Record<AlertSeverity, string> = {
    critical: 'bg-chart-3/15 text-chart-3',
    warning: 'bg-chart-4/15 text-chart-4',
    info: 'bg-primary/10 text-primary',
};

/** Destino de drill-through do alerta: detalhe da NF, ou Explorer filtrado. */
function alertLink(alert: Alert): { to: string; params?: object; search?: object } | null {
    const chave = alert.refs.chaves?.[0];
    if (chave && alert.refs.chaves?.length === 1) return { to: '/invoice/$chave', params: { chave } };
    if (alert.refs.cnpjEmitente)
        return { to: '/explore', search: { entity: 'notas', cnpjEmitente: alert.refs.cnpjEmitente } };
    return null;
}

/**
 * Centro de notificações (EPIC-27, NOTA-185): sino na Topbar com badge de
 * não-lidos (count por polling) e um popover com a lista de alertas — severidade
 * colorida, drill-through para as NF/empresa e marcar como lido. Escopo de
 * análise: alerta é informativo. Reusa o visual dos Insights.
 */
export function NotificationCenter(): JSX.Element {
    const { t } = useTranslation();
    const count = useAlertCount();
    const alerts = useAlerts();
    const markRead = useMarkAlertRead();
    const markAll = useMarkAllAlertsRead();
    const evaluate = useEvaluateAlerts();

    const unread = count.data?.unread ?? 0;
    const list = alerts.data?.alerts ?? [];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="relative" aria-label={t('alertas.titulo')} data-testid="notification-bell">
                    <Bell />
                    {unread > 0 && (
                        <span
                            className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-chart-3 px-1 text-2xs font-bold text-white tabular-nums"
                            data-testid="notification-badge"
                        >
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0" data-testid="notification-panel">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
                    <h2 className="text-sm font-bold">{t('alertas.titulo')}</h2>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button" variant="ghost" size="icon" className="size-7"
                            aria-label={t('alertas.reavaliar')}
                            disabled={evaluate.isPending}
                            onClick={() => evaluate.mutate(undefined, { onError: () => toast.error(t('comum.erro')) })}
                        >
                            <RefreshCw className={evaluate.isPending ? 'animate-spin' : ''} />
                        </Button>
                        {list.some((a) => !a.read) && (
                            <Button
                                type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                                onClick={() => markAll.mutate()}
                            >
                                <CheckCheck className="size-3.5" /> {t('alertas.marcarTodos')}
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="max-h-[26rem]">
                    {alerts.isLoading ? (
                        <div className="flex flex-col gap-2 p-3">
                            {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />)}
                        </div>
                    ) : list.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-status-ativa-bg text-status-ativa [&>svg]:size-4"><ShieldCheck /></span>
                            <p className="text-2sm font-semibold">{t('alertas.vazioTitulo')}</p>
                            <p className="text-xs text-muted-foreground">{t('alertas.vazioDescricao')}</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {list.map((a) => <AlertItem key={a.id} alert={a} onRead={() => markRead.mutate({ id: a.id })} />)}
                        </ul>
                    )}
                </ScrollArea>

                <p className="flex items-center gap-1.5 border-t px-4 py-2 text-2xs text-muted-foreground">
                    <AlertTriangle className="size-3" /> {t('alertas.aviso')}
                </p>
            </PopoverContent>
        </Popover>
    );
}

function AlertItem({ alert, onRead }: { alert: Alert; onRead: () => void }): JSX.Element {
    const { t } = useTranslation();
    const Icon = ICONS[alert.type] ?? Bell;
    const link = alertLink(alert);
    const body = (
        <div className={`flex items-start gap-2.5 px-4 py-2.5 ${alert.read ? 'opacity-60' : ''}`}>
            <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${SEVERITY_TONE[alert.severity]} [&>svg]:size-3.5`}>
                <Icon />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-2sm leading-snug">{alert.message}</p>
                <span className="text-2xs uppercase tracking-wide text-muted-foreground">{t(`alertas.tipo.${alert.type}`)}</span>
            </div>
            {!alert.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-chart-3" aria-label={t('alertas.naoLido')} />}
        </div>
    );

    return (
        // Hover marks it read (covers non-linked alerts too); the click only
        // navigates — no second mark, since a hover always precedes a click.
        <li className="transition-colors hover:bg-muted/40" onMouseEnter={alert.read ? undefined : onRead}>
            {link ? (
                <Link to={link.to as string} params={link.params as never} search={link.search as never}>
                    {body}
                </Link>
            ) : (
                body
            )}
        </li>
    );
}
