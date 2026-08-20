import { useCallback, useMemo, useState } from 'react';
import type { Flight, TrackPoint } from '@/entities/flight';
import { useTargetFlight } from '@/features/getTargetFlight';

const EMPTY_TRACK: TrackPoint[] = [];

interface SelectedFlight {
    flightId: string;
    flight: Flight | null;
    track: TrackPoint[];
    isLoading: boolean;
}

export function useFlightDetails() {
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

    const { data, isPending } = useTargetFlight(selectedFlightId ?? undefined);

    const handleDetailsOpenChange = useCallback((flightId: string, open: boolean) => {
        setSelectedFlightId((currentId) => {
            if (open) {
                return flightId;
            }

            return currentId === flightId ? null : currentId;
        });
    }, []);

    const selectedFlight = useMemo<SelectedFlight | null>(
        () =>
            selectedFlightId
                ? {
                      flightId: selectedFlightId,
                      flight: data?.flight ?? null,
                      track: data?.track ?? EMPTY_TRACK,
                      isLoading: isPending,
                  }
                : null,
        [selectedFlightId, data, isPending]
    );

    return { selectedFlight, handleDetailsOpenChange };
}
