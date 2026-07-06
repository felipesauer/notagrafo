import { type JSX } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ReceiptText } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet.js';
import { RAIL_GROUPS } from './AppSidebar.js';

/**
 * Navegação mobile (redesign BI, NOTA-125): abaixo de md o rail lateral some, e
 * a navegação vem por este Sheet (aberto pelo hambúrguer na Topbar). Reusa os
 * mesmos grupos do AppSidebar. Fecha ao navegar.
 */
export function MobileNav(): JSX.Element {
    const { t } = useTranslation();
    const open = useUIStore((s) => s.mobileNavOpen);
    const setOpen = useUIStore((s) => s.setMobileNav);
    const loc = useLocation();
    const entityAtiva = loc.pathname === '/explorar'
        ? ((loc.search as { entity?: string }).entity ?? 'notas')
        : undefined;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="flex-row items-center gap-2 border-b px-4 py-3 space-y-0">
                    <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground [&>svg]:size-4"><ReceiptText /></span>
                    <SheetTitle className="text-[15px]">notagrafo</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 p-2">
                    {RAIL_GROUPS.map((g) => (
                        <div key={g.labelKey} className="flex flex-col gap-0.5">
                            <p className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t(g.labelKey)}</p>
                            {g.items.map((r) => {
                                const isEntity = r.to === '/explorar' && !!r.search?.entity;
                                const entityActive = isEntity && entityAtiva === r.search!.entity;
                                return (
                                    <Link
                                        key={r.to + (r.search?.entity ?? '')}
                                        to={r.to as never}
                                        search={(r.search ?? undefined) as never}
                                        activeOptions={{ exact: r.exact ?? false }}
                                        aria-current={entityActive ? 'page' : undefined}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground [&>svg]:size-[18px] ${isEntity ? (entityActive ? 'bg-primary/12 font-medium text-primary' : '') : '[&.active]:bg-primary/12 [&.active]:font-medium [&.active]:text-primary'}`}
                                    >
                                        <r.icon />
                                        {t(r.labelKey)}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
