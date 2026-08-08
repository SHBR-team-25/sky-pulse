import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LiveFlightsQuery, LiveFlightsResponse } from '@entities/flights';
import { fetchJson } from '@shared/api';
import { useDebouncedParams } from '@shared/lib/useDebouncedParams';

const DEFAULT_POLL_INTERVAL_MS = 3_000;

export const liveFlightsQueryKeys = {
    all: ['live-flights'] as const,
    list: (params: LiveFlightsQuery) => [...liveFlightsQueryKeys.all, 'list', params] as const,
};

interface UseLiveFlightsOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
    debounceMs?: number;
}

export function useLiveFlights(params: LiveFlightsQuery = {}, options: UseLiveFlightsOptions = {}) {
    const debouncedParams = useDebouncedParams(params, options.debounceMs);

    return useQuery({
        queryKey: liveFlightsQueryKeys.list(debouncedParams),
        queryFn: ({ signal }) =>
            fetchJson<LiveFlightsResponse>('/flights/live', { params: debouncedParams, signal }),
        enabled: options.enabled ?? true,
        refetchInterval: options.refetchInterval ?? DEFAULT_POLL_INTERVAL_MS,
        refetchIntervalInBackground: false,
        staleTime: 0,
        placeholderData: keepPreviousData,
    });
}
