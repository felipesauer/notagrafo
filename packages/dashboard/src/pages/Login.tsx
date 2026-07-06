import { useState, type FormEvent, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { apiFetch, ApiError } from '../api/api.client.js';
import { useAuthStore, type Usuario } from '../stores/auth.store.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

interface LoginResponse {
    token: string;
    user: Usuario;
}

/** Página de login: e-mail + senha, erro inline, redirect para a rota de origem. */
export function LoginPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { redirect?: string };
    const setSession = useAuthStore((s) => s.setSession);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);

    async function onSubmit(e: FormEvent): Promise<void> {
        e.preventDefault();
        setErro(null);
        setCarregando(true);
        try {
            const res = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: { email, password: senha }, skipAuthRefresh: true });
            setSession(res.token, res.user);
            void navigate({ to: search.redirect ?? '/' });
        } catch (err) {
            setErro(err instanceof ApiError && err.status === 401 ? t('login.erroCredenciais') : t('comum.erro'));
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
                    <CardDescription>{t('login.titulo')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('login.email')}</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="senha">{t('login.senha')}</Label>
                            <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
                        </div>
                        {erro && (
                            <p role="alert" className="text-sm text-destructive">
                                {erro}
                            </p>
                        )}
                        <Button type="submit" disabled={carregando} className="w-full">
                            {carregando ? t('comum.carregando') : t('login.entrar')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
