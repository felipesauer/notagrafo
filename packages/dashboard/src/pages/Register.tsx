import { useState, type FormEvent, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from '@tanstack/react-router';
import { apiFetch, ApiError } from '../api/api.client.js';
import { useAuthStore, type Usuario } from '../stores/auth.store.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

interface RegisterResponse {
    token: string;
    user: Usuario;
}

/**
 * Página de cadastro: cria a conta própria (POST /auth/register) e já autentica
 * (guarda o token no auth.store), saindo do usuário demo. Espelha o visual do
 * Login. Confirmação de senha é validada no cliente antes de enviar.
 */
export function RegisterPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);

    async function onSubmit(e: FormEvent): Promise<void> {
        e.preventDefault();
        setErro(null);
        if (senha !== confirmar) {
            setErro(t('cadastro.senhasDiferentes'));
            return;
        }
        setCarregando(true);
        try {
            const res = await apiFetch<RegisterResponse>('/auth/register', {
                method: 'POST',
                body: { nome, email, password: senha },
                skipAuthRefresh: true,
            });
            setSession(res.token, res.user);
            void navigate({ to: '/' });
        } catch (err) {
            setErro(
                err instanceof ApiError && err.status === 409
                    ? t('cadastro.emailEmUso')
                    : t('comum.erro'),
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <img src="/notagrafo-logo.png" alt="notagrafo" className="mx-auto mb-1 h-11 w-auto" />
                    <CardTitle className="sr-only">notagrafo</CardTitle>
                    <CardDescription>{t('cadastro.titulo')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">{t('cadastro.nome')}</Label>
                            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('login.email')}</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="senha">{t('login.senha')}</Label>
                            <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} autoComplete="new-password" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmar">{t('cadastro.confirmarSenha')}</Label>
                            <Input id="confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required minLength={6} autoComplete="new-password" />
                        </div>
                        {erro && (
                            <p role="alert" className="text-sm text-destructive">
                                {erro}
                            </p>
                        )}
                        <Button type="submit" disabled={carregando} className="w-full">
                            {carregando ? t('comum.carregando') : t('cadastro.criar')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('cadastro.jaTenhoConta')}{' '}
                            <Link to={'/login' as string} className="font-medium text-primary hover:underline">
                                {t('login.entrar')}
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
