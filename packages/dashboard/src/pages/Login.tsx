import { useState, type FormEvent, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { apiFetch, ApiError } from '../api/api.client.js';
import { useAuthStore, type Usuario } from '../stores/auth.store.js';

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
        <main className="login">
            <div className="login__card">
                <h1 className="login__brand">notagrafo</h1>
                <form onSubmit={onSubmit}>
                    <label>
                        {t('login.email')}
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    </label>
                    <label>
                        {t('login.senha')}
                        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
                    </label>
                    {erro && (
                        <p role="alert" className="login__erro">
                            {erro}
                        </p>
                    )}
                    <button type="submit" disabled={carregando}>
                        {carregando ? t('comum.carregando') : t('login.entrar')}
                    </button>
                </form>
            </div>
        </main>
    );
}
