import { useCallback, useEffect, useState } from 'react';
import { flightDetailsMock } from '@/entities/flight';
import type { FlightDetailsResponse } from '@/features/getTargetFlight';

const MOCK_REQUEST_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 5_000;

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
        let didTimeout = false;

        const timeoutId = window.setTimeout(() => {
            didTimeout = true;

            if (!ignore) {
                setSelectedFlight((currentFlight) =>
                    currentFlight?.flightId === selectedFlightId
                        ? { ...currentFlight, isLoading: false }
                        : currentFlight
                );
            }
        }, REQUEST_TIMEOUT_MS);

        async function loadFlightDetails() {
            if (!selectedFlightId) {
                window.clearTimeout(timeoutId);
                return;
            }

            try {
                const details = await getFlightDetails(selectedFlightId);

                if (!ignore && !didTimeout) {
                    setSelectedFlight((currentFlight) => {
                        if (currentFlight?.flightId !== selectedFlightId) {
                            return currentFlight;
                        }

                        return { ...currentFlight, details, isLoading: false };
                    });
                }
            } catch {
                if (!ignore && !didTimeout) {
                    setSelectedFlight((currentFlight) =>
                        currentFlight?.flightId === selectedFlightId
                            ? { ...currentFlight, isLoading: false }
                            : currentFlight
                    );
                }
            } finally {
                window.clearTimeout(timeoutId);
            }
        }

        void loadFlightDetails();

        return () => {
            ignore = true;
            window.clearTimeout(timeoutId);
        };
    }, [selectedFlightId]);

    return { selectedFlight, handleDetailsOpenChange };
}
