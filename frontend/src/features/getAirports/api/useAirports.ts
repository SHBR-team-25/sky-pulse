import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { AirportsListResponse, AirportsQuery } from '../model/types';
import { fetchJson } from '@shared/api';
import { useDebouncedParams } from '@shared/lib/useDebouncedParams';

export const airportsQueryKeys = {
    all: ['airports'] as const,
    list: (params: AirportsQuery) => [...airportsQueryKeys.all, 'list', params] as const,
};

export function airportsQueryOptions(params: AirportsQuery = {}) {
    return queryOptions({
        queryKey: airportsQueryKeys.list(params),
        queryFn: ({ signal }) => fetchJson<AirportsListResponse>('/airports', { params, signal }),
    });
}

interface UseAirportsOptions {
    enabled?: boolean;
    debounceMs?: number;
}

export function useAirports(params: AirportsQuery = {}, options: UseAirportsOptions = {}) {
    const debouncedParams = useDebouncedParams(params, options.debounceMs);

    return useQuery({
        ...airportsQueryOptions(debouncedParams),
        enabled: options.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}
