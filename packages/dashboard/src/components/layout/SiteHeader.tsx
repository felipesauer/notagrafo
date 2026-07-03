import { Fragment, type JSX } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Languages, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store.js';
import { setIdioma, type Idioma } from '../../i18n/index.js';
import { breadcrumbsFor } from './breadcrumbs.js';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '../ui/breadcrumb.js';
import { Button } from '../ui/button.js';
import { Separator } from '../ui/separator.js';
import { SidebarTrigger } from '../ui/sidebar.js';

/** Header do shell: trigger da sidebar + breadcrumb + toggles de tema/idioma. */
export function SiteHeader(): JSX.Element {
    const { t, i18n } = useTranslation();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const tema = useThemeStore((s) => s.tema);
    const toggleTema = useThemeStore((s) => s.toggle);
    const crumbs = breadcrumbsFor(pathname);

    function alternarIdioma(): void {
        const prox: Idioma = i18n.language === 'pt-BR' ? 'en' : 'pt-BR';
        setIdioma(prox);
    }

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    {crumbs.map((crumb, i) => {
                        const label = crumb.literal ? crumb.label : t(crumb.label);
                        const isLast = i === crumbs.length - 1;
                        return (
                            <Fragment key={i}>
                                <BreadcrumbItem>
                                    {isLast || !crumb.to ? (
                                        <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={crumb.to as string}>{label}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleTema}
                    title={t('header.alternarTema')}
                    aria-label={t('header.alternarTema')}
                >
                    {tema === 'claro' ? <Moon /> : <Sun />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={alternarIdioma}
                    title={t('header.alternarIdioma')}
                    aria-label={t('header.alternarIdioma')}
                >
                    <Languages />
                    {i18n.language === 'pt-BR' ? 'EN' : 'PT'}
                </Button>
            </div>
        </header>
    );
}
