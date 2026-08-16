import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LiveFlightsQuery, LiveFlightsResponse } from '../model/types';
import { fetchJson } from '@shared/api';
import { useDebouncedParams } from '@shared/lib/useDebouncedParams';

const DEFAULT_POLL_INTERVAL_MS = 15000;

interface PositionDto {
    icao24: string;
    callsign: string | null;
    timePosition: number;
    lat: number;
    lon: number;
    baroAltitude: number | null;
    onGround: boolean;
    velocity: number | null;
    trueTrack: number | null;
    operator: string | null;
}

type LiveFlight = LiveFlightsResponse['flights'][number];

function toLiveFlight(position: PositionDto): LiveFlight {
    return {
        type: 'solo', // FIXME:
        count: 1,
        icao24: position.icao24,
        callsign: position.callsign,
        airlineName: position.operator,
        position: {
            icao24: position.icao24,
            lat: position.lat,
            lon: position.lon,
            altitudeM: position.baroAltitude,
            headingDeg: position.trueTrack,
            speedKmh: position.velocity === null ? null : position.velocity * 3.6,
            verticalRateMs: null,
            onGround: position.onGround,
            timestamp: position.timePosition,
        },
        phase: position.onGround ? 'on_ground' : 'cruising',
        origin: null,
        destination: null,
        squawk: null,
    };
}

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
        queryFn: async ({ signal }): Promise<LiveFlightsResponse> => {
            const positions = (
                await fetchJson<PositionDto[]>('/positions', {
                    params: {
                        minLat: debouncedParams.latMin,
                        minLon: debouncedParams.lonMin,
                        maxLat: debouncedParams.latMax,
                        maxLon: debouncedParams.lonMax,
                    },
                    signal,
                })
            ).slice(0, 20); // FIXME: limit to 20 positions for now, remove this when we have a proper backend

            return {
                generatedAt: positions.length
                    ? Math.max(...positions.map(({ timePosition }) => timePosition))
                    : Math.floor(Date.now() / 1_000),
                flights: positions.map(toLiveFlight),
            };
        },
        enabled: options.enabled ?? true,
        refetchInterval: options.refetchInterval ?? DEFAULT_POLL_INTERVAL_MS,
        refetchIntervalInBackground: false,
        staleTime: 0,
        placeholderData: keepPreviousData,
    });
}
