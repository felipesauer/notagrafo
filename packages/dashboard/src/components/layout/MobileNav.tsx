import { type JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ReceiptText } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet.js';
import { RAIL_TOP, RAIL_BOTTOM } from './AppSidebar.js';

/**
 * Navegação mobile (redesign BI, NOTA-125): abaixo de md o rail lateral some, e
 * a navegação vem por este Sheet (aberto pelo hambúrguer na Topbar). Reusa a
 * mesma lista de itens do AppSidebar. Fecha ao navegar.
 */
export function MobileNav(): JSX.Element {
    const { t } = useTranslation();
    const open = useUIStore((s) => s.mobileNavOpen);
    const setOpen = useUIStore((s) => s.setMobileNav);
    const items = [...RAIL_TOP, ...RAIL_BOTTOM];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="flex-row items-center gap-2 border-b px-4 py-3 space-y-0">
                    <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground [&>svg]:size-4"><ReceiptText /></span>
                    <SheetTitle className="text-[15px]">notagrafo</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 p-2">
                    {items.map((r) => (
                        <Link
                            key={r.to}
                            to={r.to as never}
                            activeOptions={{ exact: r.exact ?? false }}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-primary/12 [&.active]:font-medium [&.active]:text-primary [&>svg]:size-[18px]"
                        >
                            <r.icon />
                            {t(r.labelKey)}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
