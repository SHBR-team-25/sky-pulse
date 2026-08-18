import { useQuery } from '@tanstack/react-query';
import {
    toFlightDetails,
    type FlightDetails,
    type PositionDto,
    type TrackPointDto,
} from '@/entities/flight';
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
        queryFn: async ({ signal }): Promise<FlightDetails> => {
            if (!icao24) {
                throw new Error('useTargetFlight: icao24 обязателен');
            }

            const id = encodeURIComponent(icao24);
            const [position, track] = await Promise.all([
                fetchJson<PositionDto>(`/flights/${id}`, { signal }),
                fetchJson<TrackPointDto[]>(`/flights/${id}/track`, { signal }).catch(() => []),
            ]);

            return toFlightDetails(position, track);
        },
        enabled: Boolean(icao24) && (options.enabled ?? true),
        refetchInterval: options.refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 0,
    });
}
