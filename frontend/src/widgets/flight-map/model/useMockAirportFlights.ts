import { useCallback, useEffect, useState } from 'react';
import { airportFlightsMock } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';

// Тут вообще все мок

// для имитации запроса
const MOCK_REQUEST_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 5_000;

async function getMockAirportFlights(icao: string): Promise<AirportFlightsResponse | null> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, MOCK_REQUEST_DELAY_MS);
    });

    if (airportFlightsMock.airport.icao !== icao) {
        return null;
    }

    return airportFlightsMock;
}

interface SelectedAirport {
    airportId: string;
    details: AirportFlightsResponse | null;
    isLoading: boolean;
}

export function useMockAirportFlights() {
    const [selectedAirport, setSelectedAirport] = useState<SelectedAirport | null>(null);
    const selectedAirportId = selectedAirport?.airportId ?? null;

    const handleDetailsOpenChange = useCallback((airportId: string, open: boolean) => {
        setSelectedAirport((currentAirport) => {
            if (open) {
                return {
                    airportId,
                    details: null,
                    isLoading: true,
                };
            }

            return currentAirport?.airportId === airportId ? null : currentAirport;
        });
    }, []);

    useEffect(() => {
        let ignore = false;
        let didTimeout = false;

        const timeoutId = window.setTimeout(() => {
            didTimeout = true;

            if (!ignore) {
                setSelectedAirport((currentAirport) =>
                    currentAirport?.airportId === selectedAirportId
                        ? { ...currentAirport, isLoading: false }
                        : currentAirport
                );
            }
        }, REQUEST_TIMEOUT_MS);

        async function loadAirportFlights() {
            if (!selectedAirportId) {
                window.clearTimeout(timeoutId);
                return;
            }

            try {
                const details = await getMockAirportFlights(selectedAirportId);

                if (!ignore && !didTimeout) {
                    setSelectedAirport((currentAirport) => {
                        if (currentAirport?.airportId !== selectedAirportId) {
                            return currentAirport;
                        }

                        return {
                            ...currentAirport,
                            details,
                            isLoading: false,
                        };
                    });
                }
            } catch {
                if (!ignore && !didTimeout) {
                    setSelectedAirport((currentAirport) =>
                        currentAirport?.airportId === selectedAirportId
                            ? { ...currentAirport, isLoading: false }
                            : currentAirport
                    );
                }
            } finally {
                window.clearTimeout(timeoutId);
            }
        }

        void loadAirportFlights();

        return () => {
            ignore = true;
            window.clearTimeout(timeoutId);
        };
    }, [selectedAirportId]);

    return { selectedAirport, handleDetailsOpenChange };
}
