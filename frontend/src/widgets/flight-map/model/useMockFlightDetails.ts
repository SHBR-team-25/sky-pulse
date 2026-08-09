import { useCallback, useEffect, useState } from 'react';
import { flightDetailsMock } from '@/entities/flight';
import type { FlightDetailsResponse } from '@/features/getTargetFlight';

const MOCK_REQUEST_DELAY_MS = 500;

async function getFlightDetails(icao24: string): Promise<FlightDetailsResponse | null> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, MOCK_REQUEST_DELAY_MS);
    });

    return flightDetailsMock.icao24 === icao24 ? flightDetailsMock : null;
}

interface SelectedFlight {
    flightId: string;
    details: FlightDetailsResponse | null;
    isLoading: boolean;
}

export function useMockFlightDetails() {
    const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
    const selectedFlightId = selectedFlight?.flightId ?? null;

    const handleDetailsOpenChange = useCallback((flightId: string, open: boolean) => {
        setSelectedFlight((currentFlight) => {
            if (open) {
                return { flightId, details: null, isLoading: true };
            }

            return currentFlight?.flightId === flightId ? null : currentFlight;
        });
    }, []);

    useEffect(() => {
        let ignore = false;

        async function loadFlightDetails() {
            if (!selectedFlightId) {
                return;
            }

            try {
                const details = await getFlightDetails(selectedFlightId);

                if (!ignore) {
                    setSelectedFlight((currentFlight) => {
                        if (currentFlight?.flightId !== selectedFlightId) {
                            return currentFlight;
                        }

                        return details ? { ...currentFlight, details, isLoading: false } : null;
                    });
                }
            } catch {
                if (!ignore) {
                    setSelectedFlight((currentFlight) =>
                        currentFlight?.flightId === selectedFlightId ? null : currentFlight
                    );
                }
            }
        }

        void loadFlightDetails();

        return () => {
            ignore = true;
        };
    }, [selectedFlightId]);

    return { selectedFlight, handleDetailsOpenChange };
}
