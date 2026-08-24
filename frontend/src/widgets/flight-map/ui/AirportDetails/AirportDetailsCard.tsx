import type { Airport } from '@entities/airport';
import type { AirportFlightsResponse } from '@features/getAirportsFlights';
import { AirportFlightsSection } from './AirportFlightsSection';
import styles from './AirportDetails.module.css';

interface AirportDetailsCardProps {
    airport: Airport;
    details: AirportFlightsResponse;
}

export function AirportDetailsCard({ airport, details }: AirportDetailsCardProps) {
    const airportMeta = [airport.city, airport.country, airport.iata ?? airport.icao]
        .filter(Boolean)
        .join(' · ');

    return (
        <article className={styles.card} aria-label={`Информация об аэропорте ${airport.name}`}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <span className={styles.airportName}>{airport.name}</span>
                    <span className={styles.airportMeta}>{airportMeta}</span>
                </div>
            </header>

            <AirportFlightsSection flights={details.items} />
        </article>
    );
}
