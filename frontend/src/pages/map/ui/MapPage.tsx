import { airportsMock } from '@/entities/airport';
import { flightsMock } from '@/entities/flight';
import { FlightMap } from '@/widgets/flight-map';
import styles from './MapPage.module.css';

interface MapPageProps {
    theme?: 'light' | 'dark';
}

export function MapPage({ theme = 'light' }: MapPageProps) {
    return (
        <main className={styles.map} aria-label="Карта полётов и аэропортов">
            <FlightMap theme={theme} airports={airportsMock.items} flights={flightsMock.flights} />
        </main>
    );
}
