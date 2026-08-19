import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { LiveFlightsQuery, LiveFlightsResponse } from '../model/types';
import { fetchJson } from '@shared/api';
import { useDebouncedParams } from '@shared/lib/useDebouncedParams';

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export const liveFlightsQueryKeys = {
    all: ['live-flights'] as const,
    list: (params: LiveFlightsQuery) => [...liveFlightsQueryKeys.all, 'list', params] as const,
};

export function liveFlightsQueryOptions(params: LiveFlightsQuery = {}) {
    return queryOptions({
        queryKey: liveFlightsQueryKeys.list(params),
        queryFn: async ({ signal }): Promise<LiveFlightsResponse> => {
            const flights = await fetchJson<LiveFlightsResponse>('/flights/live', {
                params,
                signal,
            });

            return flights;
        },
        staleTime: DEFAULT_POLL_INTERVAL_MS,
    });
}

interface UseLiveFlightsOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
    debounceMs?: number;
}

export function useLiveFlights(params: LiveFlightsQuery = {}, options: UseLiveFlightsOptions = {}) {
    const debouncedParams = useDebouncedParams(params, options.debounceMs);

    return useQuery({
        ...liveFlightsQueryOptions(debouncedParams),
        enabled: options.enabled ?? true,
        refetchInterval: options.refetchInterval ?? DEFAULT_POLL_INTERVAL_MS,
        refetchIntervalInBackground: false,
        placeholderData: keepPreviousData,
    });
}
