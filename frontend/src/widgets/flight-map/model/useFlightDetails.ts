import { useCallback, useState } from 'react';
import type { FlightDetails } from '@/entities/flight';
import { useTargetFlight } from '@/features/getTargetFlight';

interface SelectedFlight {
    flightId: string;
    details: FlightDetails | null;
    isLoading: boolean;
}

export function useFlightDetails() {
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

    const handleDetailsOpenChange = useCallback((flightId: string, open: boolean) => {
        setSelectedFlightId((currentFlightId) => {
            if (open) {
                return flightId;
            }

            return currentFlightId === flightId ? null : currentFlightId;
        });
    }, []);

    const { data, isPending } = useTargetFlight(selectedFlightId ?? undefined);

    const selectedFlight: SelectedFlight | null = selectedFlightId
        ? {
              flightId: selectedFlightId,
              details: data ?? null,
              isLoading: isPending,
          }
        : null;

    return { selectedFlight, handleDetailsOpenChange };
}
