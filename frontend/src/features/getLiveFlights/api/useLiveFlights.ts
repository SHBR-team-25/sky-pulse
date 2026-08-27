import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { LiveFlightsQuery, LiveFlightsResponse } from '../model/types';
import { fetchJson } from '@shared/api';

const DEFAULT_POLL_INTERVAL_MS = 5_000;

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
        structuralSharing: false,
        staleTime: DEFAULT_POLL_INTERVAL_MS,
    });
}

interface UseLiveFlightsOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
}

export function useLiveFlights(params: LiveFlightsQuery = {}, options: UseLiveFlightsOptions = {}) {
    return useQuery({
        ...liveFlightsQueryOptions(params),
        enabled: options.enabled ?? true,
        refetchInterval: options.refetchInterval ?? DEFAULT_POLL_INTERVAL_MS,
        refetchIntervalInBackground: false,
        placeholderData: keepPreviousData,
    });
}
