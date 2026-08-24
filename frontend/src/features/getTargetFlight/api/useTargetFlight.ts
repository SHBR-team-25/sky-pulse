import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TargetFlight } from '../model/types';
import type { Flight, TrackPoint } from '@entities/flight';
import { fetchJson } from '@shared/api';

const REQUEST_TIMEOUT_MS = 5_000;

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
        queryFn: async ({ signal }): Promise<TargetFlight> => {
            if (!icao24) {
                throw new Error('useTargetFlight: icao24 обязателен');
            }

            const id = encodeURIComponent(icao24);
            const requestSignal = AbortSignal.any([
                signal,
                AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            ]);
            const [flight, track] = await Promise.all([
                fetchJson<Flight>(`/flights/${id}`, { signal: requestSignal }),
                fetchJson<TrackPoint[]>(`/flights/${id}/track`, { signal: requestSignal }).catch(
                    () => []
                ),
            ]);

            return { flight, track };
        },
        enabled: Boolean(icao24) && (options.enabled ?? true),
        placeholderData: keepPreviousData,
        refetchInterval: options.refetchInterval,
        refetchIntervalInBackground: false,
        retry: false,
        staleTime: 0,
    });
}
