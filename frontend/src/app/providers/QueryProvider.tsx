import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '@shared/api';

const MAX_RETRIES = 2;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.status < 500) {
                    return false;
                }

                return failureCount < MAX_RETRIES;
            },
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
