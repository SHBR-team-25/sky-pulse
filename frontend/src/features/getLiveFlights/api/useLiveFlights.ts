import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { LiveFlightsQuery, LiveFlightsResponse } from '../model/types';
import { fetchJson } from '@shared/api';
import { useDebouncedParams } from '@shared/lib/useDebouncedParams';

const DEFAULT_POLL_INTERVAL_MS = 15_000;

/**
 * Предохранитель на размер выдачи: сервер потолка не ставит, а без bbox на мировом зуме
 * приходит порядка 10–15 тысяч бортов, которые FlightsLayer рисует поштучно.
 *
 * Срез даёт «первые N в порядке ответа сервера», а не «N ближайших к центру», поэтому
 * при панорамировании набор бортов заметно скачет. Временный компромисс — снимается
 * вместе с включением FlightsClusterLayer.
 */
const MAX_RENDERED_FLIGHTS = 20;

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

            return flights.slice(0, MAX_RENDERED_FLIGHTS);
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
