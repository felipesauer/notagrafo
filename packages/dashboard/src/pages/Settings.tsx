import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Moon, Settings as SettingsIcon, Sun, XCircle } from 'lucide-react';
import { apiFetch, ApiError } from '../api/api.client.js';
import { useAuthStore, type Usuario } from '../stores/auth.store.js';
import { useThemeStore } from '../stores/theme.store.js';
import { setIdioma, type Idioma } from '../i18n/index.js';
import { LoadingSkeleton, InlineError } from '../components/shared.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { PageHeader } from '../components/PageHeader.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Switch } from '../components/ui/switch.js';
import { Label } from '../components/ui/label.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { DensityToggle } from '../components/DensityToggle.js';

interface Health {
    status: string;
    services: Record<string, string>;
    xsdVersions: string[];
    uptime: number;
}

async function fetchHealth(): Promise<Health> {
    const res = await fetch('/health');
    // A API responde 503 quando algum serviço está "degraded" — ainda é um
    // corpo JSON válido que queremos exibir. Só tratamos como erro real fora
    // de 2xx/503 (ex.: HTML do dev-server se o proxy /health faltar).
    if (!res.ok && res.status !== 503) throw new Error(`health ${res.status}`);
    return (await res.json()) as Health;
}

export function SettingsPage(): JSX.Element {
    const { t, i18n } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const setTema = useThemeStore((s) => s.setTema);
    const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

    return (
        <PageContainer width="form">
            <PageHeader
                title={t('sidebar.configuracoes')}
                description={t('config.subtitulo')}
                icon={SettingsIcon}
            />
            <div className="grid gap-4">
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
                        <div className="flex items-center justify-between">
                            <Label className="font-normal">{t('explorer.densidade')}</Label>
                            <DensityToggle />
                        </div>
                    </CardContent>
                </Card>

                {/* Perfil — editável (nome/email/senha) */}
                <PerfilCard />

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
                                <div className="grid gap-1.5">
                                    <dt className="text-xs text-muted-foreground">{t('config.servicos')}</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {Object.entries(health.data.services).map(([nome, st]) => {
                                            const ok = st === 'ok';
                                            return (
                                                <span key={nome} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                                                    {ok
                                                        ? <CheckCircle2 className="size-3.5" style={{ color: 'var(--status-ativa)' }} />
                                                        : <XCircle className="size-3.5" style={{ color: 'var(--status-cancelada)' }} />}
                                                    <span className="font-mono">{nome}</span>
                                                    <span className="text-muted-foreground">{ok ? 'ok' : st}</span>
                                                </span>
                                            );
                                        })}
                                    </dd>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-0.5">
                                        <dt className="text-xs text-muted-foreground">{t('config.xsdVersions')}</dt>
                                        <dd className="font-mono text-sm tabular-nums">{health.data.xsdVersions.join(', ')}</dd>
                                    </div>
                                    <div className="grid gap-0.5">
                                        <dt className="text-xs text-muted-foreground">{t('config.uptime')}</dt>
                                        <dd className="font-mono text-sm tabular-nums">{Math.round(health.data.uptime)}s</dd>
                                    </div>
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
        </PageContainer>
    );
}

interface AuthResponse { token: string; user: Usuario }

/**
 * Card de Perfil editável: altera nome/e-mail (PATCH /auth/me — reemite o token,
 * então atualizamos a sessão) e troca a senha (PATCH /auth/password, validando a
 * atual). Feedback via toast. Substitui o card read-only + botão desabilitado.
 */
function PerfilCard(): JSX.Element {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const setSession = useAuthStore((s) => s.setSession);

    const [editando, setEditando] = useState(false);
    const [nome, setNome] = useState(user?.nome ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [salvando, setSalvando] = useState(false);

    // Troca de senha
    const [trocandoSenha, setTrocandoSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [erroSenha, setErroSenha] = useState<string | null>(null);
    const [trocando, setTrocando] = useState(false);

    async function salvarPerfil(): Promise<void> {
        setSalvando(true);
        try {
            const res = await apiFetch<AuthResponse>('/auth/me', { method: 'PATCH', body: { nome, email } });
            setSession(res.token, res.user); // token reemitido (nome/email nos claims)
            setEditando(false);
            toast.success(t('perfil.salvo'));
        } catch (err) {
            toast.error(err instanceof ApiError && err.status === 409 ? t('perfil.emailEmUso') : t('comum.erro'));
        } finally {
            setSalvando(false);
        }
    }

    async function trocarSenha(): Promise<void> {
        setErroSenha(null);
        if (novaSenha !== confirmar) { setErroSenha(t('perfil.senhasDiferentes')); return; }
        setTrocando(true);
        try {
            await apiFetch('/auth/password', { method: 'PATCH', body: { senhaAtual, novaSenha } });
            setTrocandoSenha(false);
            setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
            toast.success(t('perfil.senhaTrocada'));
        } catch (err) {
            setErroSenha(err instanceof ApiError && err.status === 401 ? t('perfil.senhaAtualErrada') : t('comum.erro'));
        } finally {
            setTrocando(false);
        }
    }

    return (
        <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                <CardTitle className="text-base">{t('config.perfil')}</CardTitle>
                {!editando && !trocandoSenha && (
                    <Button type="button" variant="outline" size="sm" onClick={() => { setNome(user?.nome ?? ''); setEmail(user?.email ?? ''); setEditando(true); }}>
                        {t('perfil.editar')}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4 px-4">
                {editando ? (
                    <div className="grid gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="perfil-nome" className="text-xs text-muted-foreground">{t('cadastro.nome')}</Label>
                            <Input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="perfil-email" className="text-xs text-muted-foreground">{t('login.email')}</Label>
                            <Input id="perfil-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" disabled={salvando || !nome.trim() || !email.trim()} onClick={() => void salvarPerfil()}>
                                {salvando ? t('comum.carregando') : t('perfil.salvar')}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}>{t('perfil.cancelar')}</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm">
                        <p className="font-medium">{user?.nome ?? '—'}</p>
                        <p className="text-muted-foreground">{user?.email ?? '—'}</p>
                    </div>
                )}

                {/* Troca de senha */}
                {trocandoSenha ? (
                    <div className="grid gap-3 border-t pt-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="perfil-senha-atual" className="text-xs text-muted-foreground">{t('perfil.senhaAtual')}</Label>
                            <Input id="perfil-senha-atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="perfil-nova-senha" className="text-xs text-muted-foreground">{t('perfil.novaSenha')}</Label>
                            <Input id="perfil-nova-senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={6} autoComplete="new-password" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="perfil-confirmar" className="text-xs text-muted-foreground">{t('perfil.confirmarNovaSenha')}</Label>
                            <Input id="perfil-confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} minLength={6} autoComplete="new-password" />
                        </div>
                        {erroSenha && <p role="alert" className="text-sm text-destructive">{erroSenha}</p>}
                        <div className="flex gap-2">
                            <Button type="button" size="sm" disabled={trocando || !senhaAtual || novaSenha.length < 6} onClick={() => void trocarSenha()}>
                                {trocando ? t('comum.carregando') : t('perfil.trocarSenha')}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setTrocandoSenha(false); setErroSenha(null); }}>{t('perfil.cancelar')}</Button>
                        </div>
                    </div>
                ) : (
                    !editando && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setTrocandoSenha(true)}>
                            {t('perfil.trocarSenha')}
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}
