import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store.js';
import { useThemeStore } from '../stores/theme.store.js';
import { setIdioma, type Idioma } from '../i18n/index.js';
import { LoadingSkeleton, InlineError } from '../components/shared.js';
import { PageHeader } from '../components/PageHeader.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Switch } from '../components/ui/switch.js';
import { Label } from '../components/ui/label.js';
import { NativeSelect } from '../components/ui/native-select.js';

interface Health {
    status: string;
    services: Record<string, string>;
    xsdVersions: string[];
    uptime: number;
}

async function fetchHealth(): Promise<Health> {
    const res = await fetch('/health');
    return (await res.json()) as Health;
}

export function SettingsPage(): JSX.Element {
    const { t, i18n } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const tema = useThemeStore((s) => s.tema);
    const setTema = useThemeStore((s) => s.setTema);
    const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

    return (
        <div>
            <PageHeader title={t('sidebar.configuracoes')} />
            <div className="grid max-w-3xl gap-6">
                {/* Aparência */}
                <Card className="py-4">
                    <CardHeader className="px-4 pb-0"><CardTitle className="text-base">{t('config.aparencia')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4 px-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 font-normal">
                                {tema === 'escuro' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                                {t('config.tema')}
                            </Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{t('config.temaClaro')}</span>
                                <Switch
                                    checked={tema === 'escuro'}
                                    onCheckedChange={(on) => setTema(on ? 'escuro' : 'claro')}
                                    aria-label={t('config.tema')}
                                />
                                <span>{t('config.temaEscuro')}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="cfg-idioma" className="font-normal">{t('config.idioma')}</Label>
                            <NativeSelect
                                id="cfg-idioma"
                                wrapperClassName="w-48"
                                value={i18n.language}
                                onChange={(e) => setIdioma(e.target.value as Idioma)}
                            >
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en">English</option>
                            </NativeSelect>
                        </div>
                    </CardContent>
                </Card>

                {/* Perfil */}
                <Card className="py-4">
                    <CardHeader className="px-4 pb-0"><CardTitle className="text-base">{t('config.perfil')}</CardTitle></CardHeader>
                    <CardContent className="space-y-3 px-4">
                        <div className="text-sm">
                            <p className="font-medium">{user?.nome ?? '—'}</p>
                            <p className="text-muted-foreground">{user?.email ?? '—'}</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" disabled>{t('config.alterarSenha')}</Button>
                    </CardContent>
                </Card>

                {/* Sistema (health) */}
                <Card className="py-4">
                    <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                        <CardTitle className="text-base">{t('config.sistema')}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => void health.refetch()}>{t('config.verificarSaude')}</Button>
                    </CardHeader>
                    <CardContent className="px-4">
                        {health.isLoading ? (
                            <LoadingSkeleton linhas={2} />
                        ) : health.isError ? (
                            <InlineError onRetry={() => void health.refetch()} />
                        ) : health.data ? (
                            <dl className="grid gap-3">
                                <div className="grid gap-0.5">
                                    <dt className="text-xs text-muted-foreground">{t('config.servicos')}</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {Object.entries(health.data.services).map(([nome, st]) => (
                                            <span key={nome} className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                                                <span className="size-2 rounded-full" style={{ background: st === 'ok' ? 'var(--status-ativa)' : 'var(--status-cancelada)' }} />
                                                {nome}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                                <div className="grid gap-0.5">
                                    <dt className="text-xs text-muted-foreground">{t('config.xsdVersions')}</dt>
                                    <dd className="text-sm tabular-nums">{health.data.xsdVersions.join(', ')}</dd>
                                </div>
                                <div className="grid gap-0.5">
                                    <dt className="text-xs text-muted-foreground">{t('config.uptime')}</dt>
                                    <dd className="text-sm tabular-nums">{Math.round(health.data.uptime)}s</dd>
                                </div>
                            </dl>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Sobre / armazenamento */}
                <Card className="py-4">
                    <CardHeader className="px-4 pb-0"><CardTitle className="text-base">{t('config.sobre')}</CardTitle></CardHeader>
                    <CardContent className="px-4 text-sm text-muted-foreground">
                        {t('config.armazenamento')}: <span className="font-mono text-foreground">minio</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
