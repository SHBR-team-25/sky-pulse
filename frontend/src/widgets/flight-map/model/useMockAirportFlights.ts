import { useCallback, useEffect, useState } from 'react';
import { airportFlightsMock } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';

// Тут вообще все мок

// для имитации запроса
const MOCK_REQUEST_DELAY_MS = 500;

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

        async function loadAirportFlights() {
            if (!selectedAirportId) {
                return;
            }

            try {
                const details = await getMockAirportFlights(selectedAirportId);

                if (!ignore) {
                    setSelectedAirport((currentAirport) => {
                        if (currentAirport?.airportId !== selectedAirportId) {
                            return currentAirport;
                        }

                        return details
                            ? {
                                  ...currentAirport,
                                  details,
                                  isLoading: false,
                              }
                            : null;
                    });
                }
            } catch {
                if (!ignore) {
                    setSelectedAirport((currentAirport) =>
                        currentAirport?.airportId === selectedAirportId ? null : currentAirport
                    );
                }
            }
        }

        void loadAirportFlights();

        return () => {
            ignore = true;
        };
    }, [selectedAirportId]);

    return { selectedAirport, handleDetailsOpenChange };
}
