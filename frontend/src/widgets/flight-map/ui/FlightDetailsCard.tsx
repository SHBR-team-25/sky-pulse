import { AirportTooltip } from '@/entities/airport';
import {
    formatEta,
    formatFlightNumber,
    formatTime,
    numberFormatter,
} from '@/shared/lib/formatters';
import styles from './FlightDetailsPopover.module.css';
import type { FlightDetails } from '@/entities/flight';

interface FlightDetailsCardProps {
    details: FlightDetails;
}

const phaseLabels: Record<FlightDetails['phase'], string> = {
    on_ground: 'На земле',
    climbing: 'Набор',
    descending: 'Снижение',
    cruising: 'В пути',
};

interface AirportCodeTooltipProps {
    code: string;
    name: string;
}

function AirportCodeTooltip({ code, name }: AirportCodeTooltipProps) {
    return (
        <AirportTooltip content={name}>
            <strong className={styles.airportCode} tabIndex={0}>
                {code}
            </strong>
        </AirportTooltip>
    );
}

export function FlightDetailsCard({ details }: FlightDetailsCardProps) {
    const flightNumber = formatFlightNumber(details.callsign);
    const airlineName = details.airlineName;
    const aircraft = [details.manufacturer, details.model].filter(Boolean).join(' '); // собирает полное название через пробел например Airbus A321
    const originCode = details.origin?.iata ?? details.origin?.icao ?? '—';
    const destinationCode = details.destination?.iata ?? details.destination?.icao ?? '—';
    const originName = details.origin?.name ?? 'Аэропорт неизвестен';
    const destinationName = details.destination?.name ?? 'Аэропорт неизвестен';
    const speed = details.position.speedKmh;
    const altitude = details.position.altitudeM;
    const heading = details.position.headingDeg;

    return (
        <article className={styles.card} aria-label={`Информация о рейсе ${flightNumber}`}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <strong className={styles.flightNumber}>{flightNumber}</strong>
                    <span className={styles.aircraftMeta}>
                        {airlineName ?? 'Авиакомпания неизвестна'} · {aircraft || 'Тип неизвестен'}
                        {' · '}
                        {details.registration ?? 'Борт неизвестен'}
                    </span>
                </div>
                <span className={styles.status}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {phaseLabels[details.phase]}
                </span>
            </header>

            <section className={styles.route} aria-label="Маршрут рейса">
                <div className={styles.airport}>
                    <AirportCodeTooltip code={originCode} name={originName} />
                    <span className={styles.airportMeta}>{formatTime(details.startTime)}</span>
                </div>

                {/* // Это стрелочка между "от" и "куда", подумать оставить так или высчитывать сколько осталось лететь 
                // TODO: */}
                <div className={styles.routeProgress} aria-hidden="true">
                    <span className={styles.routeTrack} />
                    <span className={styles.routeTrackComplete} />
                    <span className={styles.routePlane} />
                </div>
                <div className={`${styles.airport} ${styles.destination}`}>
                    <AirportCodeTooltip code={destinationCode} name={destinationName} />
                    <span className={styles.airportMeta}>{formatTime(details.endTime)}</span>
                </div>
            </section>

            <dl className={styles.metrics}>
                <div className={styles.metric}>
                    <dt>Скорость</dt>
                    <dd>
                        {speed === null ? '—' : numberFormatter.format(speed)} <span>км/ч</span>
                    </dd>
                </div>
                <div className={styles.metric}>
                    <dt>Высота</dt>
                    <dd>
                        {altitude === null ? '—' : numberFormatter.format(altitude)} <span>м</span>
                    </dd>
                </div>
                <div className={styles.metric}>
                    <dt>Курс</dt>
                    <dd>{heading === null ? '—' : `${numberFormatter.format(heading)}°`}</dd>
                </div>
            </dl>

            <footer className={styles.footer}>
                <span>
                    {/* //TODO: подумать отображать ли (придется делать поллинг) */}
                    Прибытие через{' '}
                    <strong className={styles.eta}>{formatEta(details.etaMinutes)}</strong>
                </span>
            </footer>
        </article>
    );
}
