import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './fetchJson';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
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
            throwOnError: (_error, query) => query.state.data === undefined,
        },
    },
});
