import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select nativo (<select>) estilizado — mantido nativo de propósito: os testes
 * e2e o manipulam via selectOption() (ADR-10). appearance-none remove o widget
 * do SO (que renderiza branco no dark) e desenhamos o chevron por cima;
 * bg-popover/text-popover-foreground fazem as <option> herdarem o tema.
 */
function NativeSelect({
    className,
    wrapperClassName,
    children,
    ...props
}: React.ComponentProps<'select'> & { wrapperClassName?: string }): React.JSX.Element {
    return (
        <div className={cn('relative inline-flex', wrapperClassName)}>
            <select
                data-slot="native-select"
                className={cn(
                    'h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-9 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    '[&>option]:bg-popover [&>option]:text-popover-foreground',
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
    );
}

export { NativeSelect };
