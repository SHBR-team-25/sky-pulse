import { useCallback, useEffect, useState } from 'react';
import { airportFlightsMock, type AirportFlightsDirection } from '@/entities/airport';
import type { AirportFlightsQuery, AirportFlightsResponse } from '@/features/getAirportsFlights';

// Тут вообще все мок

// для имитации запроса
const MOCK_REQUEST_DELAY_MS = 500;

async function getMockAirportFlights(
    icao: string,
    params: AirportFlightsQuery = {}
): Promise<AirportFlightsResponse | null> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, MOCK_REQUEST_DELAY_MS);
    });

    if (airportFlightsMock.airport.icao !== icao) {
        return null;
    }

    const direction = params.direction ?? 'all';

    return {
        ...airportFlightsMock,
        items: airportFlightsMock.items.filter(
            (flight) =>
                (direction === 'all' || flight.direction === direction) &&
                (params.from === undefined || flight.observedAt >= params.from) &&
                (params.to === undefined || flight.observedAt <= params.to)
        ),
    };
}

interface SelectedAirport {
    airportId: string;
    details: AirportFlightsResponse | null;
    direction: AirportFlightsDirection;
    isLoading: boolean;
}

export function useMockAirportFlights() {
    const [selectedAirport, setSelectedAirport] = useState<SelectedAirport | null>(null);
    const selectedAirportId = selectedAirport?.airportId ?? null;
    const selectedDirection = selectedAirport?.direction ?? 'all';

    const handleDetailsOpenChange = useCallback((airportId: string, open: boolean) => {
        setSelectedAirport((currentAirport) => {
            if (open) {
                return {
                    airportId,
                    details: null,
                    direction: 'all',
                    isLoading: true,
                };
            }

            return currentAirport?.airportId === airportId ? null : currentAirport;
        });
    }, []);

    const handleDirectionChange = useCallback(
        (airportId: string, direction: AirportFlightsDirection) => {
            setSelectedAirport((currentAirport) => {
                if (
                    currentAirport?.airportId !== airportId ||
                    currentAirport.direction === direction
                ) {
                    return currentAirport;
                }

                return { ...currentAirport, details: null, direction, isLoading: true };
            });
        },
        []
    );

    useEffect(() => {
        let ignore = false;

        async function loadAirportFlights() {
            if (!selectedAirportId) {
                return;
            }

            try {
                const details = await getMockAirportFlights(selectedAirportId, {
                    direction: selectedDirection,
                });

                if (!ignore) {
                    setSelectedAirport((currentAirport) => {
                        if (
                            currentAirport?.airportId !== selectedAirportId ||
                            currentAirport.direction !== selectedDirection
                        ) {
                            return currentAirport;
                        }

                        return details ? { ...currentAirport, details, isLoading: false } : null;
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
    }, [selectedAirportId, selectedDirection]);

    return { selectedAirport, handleDetailsOpenChange, handleDirectionChange };
}
