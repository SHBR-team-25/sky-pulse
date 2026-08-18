import { airportsMock } from '@/entities/airport';
import { flightsMock } from '@/entities/flight';
import { FlightMap } from '@/widgets/flight-map';
import { useAppTheme } from '@/shared/contexts/theme';
import styles from './MapPage.module.css';

export function MapPage() {
    const { theme } = useAppTheme();

    return (
        <main className={styles.map} aria-label="Карта полётов и аэропортов">
            <FlightMap theme={theme} airports={airportsMock.items} flights={flightsMock.flights} />
        </main>
    );
}
