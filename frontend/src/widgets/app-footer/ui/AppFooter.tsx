import { useMapView } from '@/shared/contexts/map-view';
import { formatMapView } from '@/shared/lib/formatters';
import styles from './AppFooter.module.css';

export function AppFooter() {
    const { center, zoom } = useMapView();
    const [longitude, latitude] = center;
    const formattedLocation = formatMapView(zoom, longitude, latitude);

    return (
        <footer className={styles.footer}>
            <ul className={styles.technicalInfo} aria-label="Параметры карты">
                <li key="interval">Задержка данных 5 с</li>
                <li>{formattedLocation}</li>
            </ul>
        </footer>
    );
}
