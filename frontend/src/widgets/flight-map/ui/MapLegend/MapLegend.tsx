import { HelpMark } from '@gravity-ui/uikit';
import { AirportClusterMarker, AirportMarker } from '@/entities/airport';
import { FlightClusterMarker, FlightMarker } from '@/entities/flight';
import styles from './MapLegend.module.css';

const LEGEND_FLIGHTS_IN_CLUSTER = 12;
const LEGEND_AIRPORTS_IN_CLUSTER = 5;

export function MapLegend() {
    return (
        <HelpMark
            className={styles.legendWrapper}
            iconSize="xl"
            popoverProps={{
                className: styles.legendPopover,
                placement: ['bottom-end', 'bottom-start'],
            }}
        >
            <div className={styles.legend}>
                <section className={styles.legendSection}>
                    <h4 className={styles.legendTitle}>Рейсы</h4>
                    <ul className={styles.legendList}>
                        <li className={styles.legendRow}>
                            <span className={styles.legendIcon}>
                                <FlightMarker decorative />
                            </span>
                            Рейс в воздухе
                        </li>
                        <li className={styles.legendRow}>
                            <span className={styles.legendIcon}>
                                <FlightClusterMarker count={LEGEND_FLIGHTS_IN_CLUSTER} decorative />
                            </span>
                            Кластер рейсов: число — сколько бортов внутри
                        </li>
                    </ul>
                </section>

                <section className={styles.legendSection}>
                    <h4 className={styles.legendTitle}>Аэропорты</h4>
                    <ul className={styles.legendList}>
                        <li className={styles.legendRow}>
                            <span className={styles.legendIcon}>
                                <AirportMarker decorative />
                            </span>
                            Аэропорт
                        </li>
                        <li className={styles.legendRow}>
                            <span className={styles.legendIcon}>
                                <AirportClusterMarker
                                    count={LEGEND_AIRPORTS_IN_CLUSTER}
                                    decorative
                                />
                            </span>
                            Кластер аэропортов: число — сколько аэропортов внутри
                        </li>
                    </ul>
                </section>
            </div>
        </HelpMark>
    );
}
