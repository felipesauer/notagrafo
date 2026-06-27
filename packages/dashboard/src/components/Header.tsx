import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/theme.store.js';
import { setIdioma, type Idioma } from '../i18n/index.js';
import { useExportStore } from '../stores/export.store.js';

/** Header global: breadcrumb + toggle de tema/idioma + sino. */
export function Header({ titulo }: { titulo: string }): JSX.Element {
    const { t, i18n } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const toggleTema = useThemeStore((s) => s.toggle);
    const jobAtivo = useExportStore((s) => s.jobAtivo);
    const temNotificacao = jobAtivo?.status === 'ready';

    function alternarIdioma(): void {
        const prox: Idioma = i18n.language === 'pt-BR' ? 'en' : 'pt-BR';
        setIdioma(prox);
    }

    return (
        <header className="header">
            <h1 className="header__breadcrumb">{titulo}</h1>
            <div className="header__actions">
                <button type="button" onClick={toggleTema} title={t('header.alternarTema')} aria-label={t('header.alternarTema')}>
                    {tema === 'claro' ? '🌙' : '☀️'}
                </button>
                <button type="button" onClick={alternarIdioma} title={t('header.alternarIdioma')} aria-label={t('header.alternarIdioma')}>
                    {i18n.language === 'pt-BR' ? 'EN' : 'PT'}
                </button>
                <button type="button" title={t('header.notificacoes')} aria-label={t('header.notificacoes')} className={temNotificacao ? 'header__bell header__bell--active' : 'header__bell'}>
                    🔔{temNotificacao ? ' •' : ''}
                </button>
            </div>
        </header>
    );
}
