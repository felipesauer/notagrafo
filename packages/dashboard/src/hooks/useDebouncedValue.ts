import { useEffect, useState } from 'react';

/**
 * Retorna `value` após ele ficar estável por `delayMs`. Usado na busca da lista
 * de NFs para não refazer o fetch a cada tecla (NOTA-89).
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}
