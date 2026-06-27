import { QueryClient } from '@tanstack/react-query';

/** Cliente TanStack Query compartilhado. */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
