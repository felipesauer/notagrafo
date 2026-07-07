import { type JSX, type ReactNode } from 'react';
import { Card, CardContent } from './ui/card.js';
import { TablePagination } from './TablePagination.js';

/**
 * Contorno padrão das listagens (mesmo estilo do feed de Eventos): a tabela/lista
 * fica dentro de um Card com borda (py-0/p-0, sem padding próprio — a tabela
 * encosta na borda), e a paginação vem logo abaixo num bloco com borda própria.
 *
 * `pagination`: props do TablePagination (client ou cursor); se omitido, não
 * renderiza o rodapé (ex.: tabelas sem paginação).
 */
export function TableCard({
    children,
    pagination,
    className,
}: {
    children: ReactNode;
    pagination?: React.ComponentProps<typeof TablePagination>;
    className?: string;
}): JSX.Element {
    return (
        <div className={className}>
            {/* O contorno vem do Card; o <Table> shadcn já embrulha num
                container overflow-x-auto — deixamos ESSE container recortar
                (rounded-lg) e rolar na horizontal, sem overflow-hidden no Card
                (que cortaria a última coluna de tabelas largas em vez de rolar). */}
            <Card className="py-0">
                <CardContent className="p-0 [&>[data-slot=table-container]]:rounded-xl">{children}</CardContent>
            </Card>
            {pagination && (
                <div className="mt-2 rounded-lg border">
                    <TablePagination {...pagination} />
                </div>
            )}
        </div>
    );
}
