import {
    formatCoordinate,
    formatFlightNumber,
    formatSpeedKmh,
    formatTime,
    numberFormatter,
} from '@/shared/lib/formatters';
import styles from './FlightDetails.module.css';
import type { Flight } from '@/entities/flight';

interface FlightDetailsCardProps {
    flight: Flight;
}

export function FlightDetailsCard({ flight }: FlightDetailsCardProps) {
    const flightNumber = formatFlightNumber(flight.callsign);
    const aircraft = [flight.manufacturername, flight.model].filter(Boolean).join(' '); // собирает полное название через пробел например Airbus A321
    // Сервис отдаёт высоту и курс как double (10957.5, 324.75) — в карточке дробная часть не нужна
    const altitude = flight.baroAltitude;
    const heading = flight.trueTrack;

    return (
        <article className={styles.card} aria-label={`Информация о рейсе ${flightNumber}`}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <strong className={styles.flightNumber}>{flightNumber}</strong>
                    <span className={styles.aircraftMeta}>
                        {flight.operator ?? 'Авиакомпания неизвестна'} ·{' '}
                        {aircraft || 'Тип неизвестен'}
                    </span>
                </div>
                <span className={styles.status}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {flight.onGround ? 'На земле' : 'В воздухе'}
                </span>
            </header>

            <section className={styles.origin} aria-label="Регистрация и позиция борта">
                <span className={styles.originCountry}>
                    {flight.originCountry ?? 'Страна неизвестна'}
                </span>
                <span className={styles.coordinates}>
                    {formatCoordinate(flight.lat, 'N', 'S')} ·{' '}
                    {formatCoordinate(flight.lon, 'E', 'W')}
                </span>
            </section>

            <dl className={styles.metrics}>
                <div className={styles.metric}>
                    <dt>Скорость</dt>
                    <dd>
                        {formatSpeedKmh(flight.velocity)} <span>км/ч</span>
                    </dd>
                </div>
                <div className={styles.metric}>
                    <dt>Высота</dt>
                    <dd>
                        {altitude === null ? '—' : numberFormatter.format(Math.round(altitude))}{' '}
                        <span>м</span>
                    </dd>
                </div>
                <div className={styles.metric}>
                    <dt>Курс</dt>
                    <dd>
                        {heading === null ? '—' : `${numberFormatter.format(Math.round(heading))}°`}
                    </dd>
                </div>
            </dl>

            <footer className={styles.footer}>
                <span>
                    Обновлено в <strong>{formatTime(flight.timePosition)}</strong>
                </span>
            </footer>
        </article>
    );
}
