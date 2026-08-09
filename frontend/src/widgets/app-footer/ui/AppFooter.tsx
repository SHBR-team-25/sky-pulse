import { footerMock } from '../model/mock-data';
import { useMapView } from '@/shared/contexts/map-view';
import { formatMapView } from '@/shared/lib/formatters';
import styles from './AppFooter.module.css';

export function AppFooter() {
    const { center, zoom } = useMapView();
    const [longitude, latitude] = center;
    const formattedLocation = formatMapView(zoom, longitude, latitude);

    return (
        <footer className={styles.footer}>
            {/* <ul className={styles.statusList} aria-label="Статусы рейсов">
                {footerMock.flightStatuses.map((status) => (
                    <li className={styles.statusItem} key={status.label}>
                        <span
                            className={`${styles.statusDot} ${styles[status.tone]}`}
                            aria-hidden="true"
                        />
                        <span>
                            {status.label} · {status.value}
                        </span>
                    </li>
                ))}
            </ul> */}

            <ul className={styles.technicalInfo} aria-label="Параметры карты">
                {footerMock.technicalInfo.map((item) => (
                    <li key={item}>{item}</li>
                ))}
                <li>{formattedLocation}</li>
            </ul>
        </footer>
    );
}
