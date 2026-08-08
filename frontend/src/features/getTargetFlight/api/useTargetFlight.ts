import { useQuery } from '@tanstack/react-query';
import type { FlightDetailsResponse } from '../model/types';
import { fetchJson } from '@shared/api';

export const targetFlightQueryKeys = {
    all: ['target-flight'] as const,
    details: (icao24: string | undefined) => [...targetFlightQueryKeys.all, icao24] as const,
};

interface UseTargetFlightOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
}

export function useTargetFlight(icao24: string | undefined, options: UseTargetFlightOptions = {}) {
    return useQuery({
        queryKey: targetFlightQueryKeys.details(icao24),
        queryFn: ({ signal }) => {
            if (!icao24) {
                throw new Error('useTargetFlight: icao24 обязателен');
            }

            return fetchJson<FlightDetailsResponse>(`/flights/${encodeURIComponent(icao24)}`, {
                signal,
            });
        },
        enabled: Boolean(icao24) && (options.enabled ?? true),
        refetchInterval: options.refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 0,
    });
}
