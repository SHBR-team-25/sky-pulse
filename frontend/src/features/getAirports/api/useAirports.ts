import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { AirportsListResponse, AirportsQuery } from '../model/types';
import { fetchJson } from '@shared/api';

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
}

export function useAirports(params: AirportsQuery = {}, options: UseAirportsOptions = {}) {
    // Дебаунс делает вызывающая сторона (FlightMap), второй дебаунс удвоил бы задержку
    return useQuery({
        ...airportsQueryOptions(params),
        enabled: options.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}
