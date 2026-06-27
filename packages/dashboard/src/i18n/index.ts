import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ptBR } from './pt-BR.js';
import { en } from './en.js';

/** Idioma suportado pelo dashboard. */
export type Idioma = 'pt-BR' | 'en';

export const IDIOMAS: Idioma[] = ['pt-BR', 'en'];

/** Idioma inicial: o salvo, senão o do navegador, com fallback pt-BR. */
function idiomaInicial(): Idioma {
    const salvo = typeof localStorage !== 'undefined' ? localStorage.getItem('nfp_idioma') : null;
    if (salvo === 'pt-BR' || salvo === 'en') return salvo;
    const nav = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR';
    return nav.startsWith('en') ? 'en' : 'pt-BR';
}

void i18n.use(initReactI18next).init({
    resources: {
        'pt-BR': { translation: ptBR },
        en: { translation: en },
    },
    lng: idiomaInicial(),
    fallbackLng: 'pt-BR',
    interpolation: { escapeValue: false },
});

/** Troca o idioma e persiste a escolha. */
export function setIdioma(idioma: Idioma): void {
    void i18n.changeLanguage(idioma);
    if (typeof localStorage !== 'undefined') localStorage.setItem('nfp_idioma', idioma);
}

export default i18n;
