import { useCallback, useState } from 'react';
import { List } from '@gravity-ui/uikit';
import { AirportTooltip, type AirportFlight } from '@/entities/airport';
import { formatFlightNumber, formatTime } from '@/shared/lib/formatters';
import styles from './AirportDetails.module.css';

const FLIGHTS_PAGE_SIZE = 10;
const FLIGHT_ROW_HEIGHT = 45;
const LIST_OVERSCAN = 2;

interface AirportFlightsListProps {
    flights: AirportFlight[];
}

export function AirportFlightsList({ flights }: AirportFlightsListProps) {
    const [visibleFlightsCount, setVisibleFlightsCount] = useState(FLIGHTS_PAGE_SIZE);
    const displayedFlights = flights.slice(0, visibleFlightsCount + LIST_OVERSCAN);
    const hasMoreFlights = displayedFlights.length < flights.length;

    const handleLoadMore = useCallback(() => {
        setVisibleFlightsCount((currentCount) =>
            Math.min(currentCount + FLIGHTS_PAGE_SIZE, flights.length)
        );
    }, [flights.length]);

    if (flights.length === 0) {
        return <div className={styles.empty}>Рейсы не найдены</div>;
    }

    return (
        <>
            <div className={styles.tableHeader} aria-hidden="true">
                <span>Время</span>
                <span>Рейс</span>
                <span>Маршрут</span>
                <span>Тип</span>
            </div>
            <List
                className={styles.flightList}
                items={displayedFlights}
                itemHeight={FLIGHT_ROW_HEIGHT}
                itemKey={(flight) => `${flight.icao24}-${flight.direction}-${flight.observedAt}`}
                filterable={false}
                virtualized
                loading={hasMoreFlights}
                onLoadMore={handleLoadMore}
                renderItem={(flight) => {
                    const otherAirportCode =
                        flight.otherAirport?.iata ?? flight.otherAirport?.icao ?? '—';
                    const otherAirportName = flight.otherAirport?.name ?? 'Аэропорт неизвестен';
                    const isDeparture = flight.direction === 'departure';
                    const directionLabel = isDeparture ? 'Вылет' : 'Прилёт';

                    return (
                        <div className={styles.flightRow}>
                            <time dateTime={new Date(flight.observedAt * 1000).toISOString()}>
                                {formatTime(flight.observedAt)}
                            </time>
                            <span className={styles.flightIdentity}>
                                <strong>{formatFlightNumber(flight.callsign)}</strong>
                                <small>{flight.airlineName ?? flight.icao24}</small>
                            </span>
                            <span className={styles.route}>
                                <strong>
                                    {otherAirportCode === '-' ? '' : isDeparture ? '→' : '←'}{' '}
                                    {otherAirportCode}
                                </strong>

                                <AirportTooltip content={otherAirportName}>
                                    <small tabIndex={0}>{otherAirportName}</small>
                                </AirportTooltip>
                            </span>
                            <span className={styles.direction} data-direction={flight.direction}>
                                <span aria-hidden="true" />
                                {directionLabel}
                            </span>
                        </div>
                    );
                }}
            />
        </>
    );
}
