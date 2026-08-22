import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AirportFlightsQuery, AirportFlightsResponse } from '../model/types';
import { fetchJson } from '@shared/api';

const REQUEST_TIMEOUT_MS = 5_000;

export const airportFlightsQueryKeys = {
    all: ['airport-flights'] as const,
    list: (icao: string | undefined, params: AirportFlightsQuery) =>
        [...airportFlightsQueryKeys.all, icao, params] as const,
};

interface UseAirportsFlightsOptions {
    enabled?: boolean;
}

export function useAirportsFlights(
    icao: string | undefined,
    params: AirportFlightsQuery = {},
    options: UseAirportsFlightsOptions = {}
) {
    return useQuery({
        queryKey: airportFlightsQueryKeys.list(icao, params),
        queryFn: ({ signal }) => {
            if (!icao) {
                throw new Error('useAirportsFlights: icao обязателен');
            }

            return fetchJson<AirportFlightsResponse>(
                `/airports/${encodeURIComponent(icao)}/flights`,
                {
                    params,
                    signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
                }
            );
        },
        enabled: Boolean(icao) && (options.enabled ?? true),
        placeholderData: keepPreviousData,
        retry: false, // TODO: подумать надо ли ретрай
    });
}
