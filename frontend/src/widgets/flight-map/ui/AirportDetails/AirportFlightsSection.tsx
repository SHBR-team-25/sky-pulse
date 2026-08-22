import { useMemo, useState } from 'react';
import type { AirportFlight, AirportFlightsDirection } from '@/entities/airport';
import { AirportFlightsList } from './AirportFlightsList';
import styles from './AirportDetails.module.css';

const directionTabs: { value: AirportFlightsDirection; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'departure', label: 'Вылеты' },
    { value: 'arrival', label: 'Прилёты' },
];

interface AirportFlightsSectionProps {
    flights: AirportFlight[];
}

export function AirportFlightsSection({ flights }: AirportFlightsSectionProps) {
    const [direction, setDirection] = useState<AirportFlightsDirection>('all');

    const flightsByDirection = useMemo<Record<AirportFlightsDirection, AirportFlight[]>>(() => {
        const allFlights = flights.toSorted((left, right) => right.observedAt - left.observedAt);

        return {
            all: allFlights,
            departure: allFlights.filter((flight) => flight.direction === 'departure'),
            arrival: allFlights.filter((flight) => flight.direction === 'arrival'),
        };
    }, [flights]);

    return (
        <>
            <div className={styles.tabs} role="tablist" aria-label="Направление рейсов">
                {directionTabs.map((tab) => (
                    <button
                        className={styles.tab}
                        data-active={tab.value === direction || undefined}
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={tab.value === direction}
                        onClick={() => setDirection(tab.value)}
                    >
                        {tab.label}
                        <span className={styles.tabCount}>
                            {flightsByDirection[tab.value].length}
                        </span>
                    </button>
                ))}
            </div>

            <AirportFlightsList key={direction} flights={flightsByDirection[direction]} />
        </>
    );
}
