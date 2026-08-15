import { useState } from 'react';
import type { AirportFlight, AirportFlightsDirection } from '@/entities/airport';
import { AirportFlightsList } from './AirportFlightsList';
import styles from './AirportDetailsPopover.module.css';

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

    // TODO:  возможно переместить отсюда сортировку в другое место где будет вызываться запрс на бек
    // нужно чтобы фильтрация происходила 1 раз и не делала при перключении табов
    const [allFlights] = useState(() =>
        flights.toSorted((left, right) => right.observedAt - left.observedAt)
    );
    const [departureFlights] = useState(() =>
        allFlights.filter((flight) => flight.direction === 'departure')
    );
    const [arrivalFlights] = useState(() =>
        allFlights.filter((flight) => flight.direction === 'arrival')
    );
    const flightsByDirection: Record<AirportFlightsDirection, AirportFlight[]> = {
        all: allFlights,
        departure: departureFlights,
        arrival: arrivalFlights,
    };

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
