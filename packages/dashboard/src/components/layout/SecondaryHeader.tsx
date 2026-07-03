import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Languages, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store.js';
import { setIdioma, type Idioma } from '../../i18n/index.js';
import { Button } from '../ui/button.js';

/**
 * Header enxuto das telas secundárias (fora do explorador): volta ao explorador
 * + marca + toggles de tema/idioma. A navegação primária vive no rail do Explorer
 * e no Cmd+K; aqui basta um caminho de volta e os controles globais.
 */
export function SecondaryHeader(): JSX.Element {
    const { t, i18n } = useTranslation();
    const tema = useThemeStore((s) => s.tema);
    const toggleTema = useThemeStore((s) => s.toggle);

    return (
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
            <Button asChild type="button" variant="ghost" size="sm" className="-ml-2">
                <Link to={'/' as string}><ArrowLeft /> {t('sidebar.explorar')}</Link>
            </Button>
            <div className="ml-auto flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={toggleTema} aria-label={t('header.alternarTema')}>
                    {tema === 'claro' ? <Moon /> : <Sun />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIdioma(i18n.language === 'pt-BR' ? 'en' : ('pt-BR' as Idioma))} aria-label={t('header.alternarIdioma')}>
                    <Languages /> {i18n.language === 'pt-BR' ? 'EN' : 'PT'}
                </Button>
            </div>
        </header>
    );
}
