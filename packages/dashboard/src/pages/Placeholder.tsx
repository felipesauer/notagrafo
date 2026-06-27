import { type JSX } from 'react';

/** Placeholder para páginas ainda não implementadas (NOTA-24/25/26). */
export function Placeholder({ titulo }: { titulo: string }): JSX.Element {
    return (
        <section className="placeholder">
            <h2>{titulo}</h2>
            <p>Em construção.</p>
        </section>
    );
}
