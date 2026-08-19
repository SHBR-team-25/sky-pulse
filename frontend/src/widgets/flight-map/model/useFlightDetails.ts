import { useCallback, useState } from 'react';
import type { Flight, TrackPoint } from '@/entities/flight';
import { useTargetFlight } from '@/features/getTargetFlight';

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

    const selectedFlight: SelectedFlight | null = selectedFlightId
        ? {
              flightId: selectedFlightId,
              flight: data?.flight ?? null,
              track: data?.track ?? [],
              isLoading: isPending,
          }
        : null;

    return { selectedFlight, handleDetailsOpenChange };
}
