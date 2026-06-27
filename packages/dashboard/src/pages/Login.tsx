import { useState, type FormEvent, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { apiFetch, ApiError } from '../api/api.client.js';
import { useAuthStore, type Usuario } from '../stores/auth.store.js';

interface LoginResponse {
    token: string;
    user: Usuario;
}

/** Página de login (versão base do setup; refinada na NOTA-23). */
export function LoginPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | null>(null);

    async function onSubmit(e: FormEvent): Promise<void> {
        e.preventDefault();
        setErro(null);
        try {
            const res = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: { email, password: senha } });
            setSession(res.token, res.user);
            void navigate({ to: '/' });
        } catch (err) {
            setErro(err instanceof ApiError ? t('login.erroCredenciais') : t('comum.erro'));
        }
    }

    return (
        <main className="login">
            <h1>{t('login.titulo')}</h1>
            <form onSubmit={onSubmit}>
                <label>
                    {t('login.email')}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                    {t('login.senha')}
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                </label>
                {erro && <p role="alert">{erro}</p>}
                <button type="submit">{t('login.entrar')}</button>
            </form>
        </main>
    );
}
