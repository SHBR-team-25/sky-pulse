import { useCallback, useState } from 'react';
import { List } from '@gravity-ui/uikit';
import { formatFlightNumber, formatTime } from '@/shared/lib/formatters';
import type { Airport, AirportFlightsDirection } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';
import styles from './AirportDetailsPopover.module.css';

const FLIGHTS_PAGE_SIZE = 10;
const FLIGHT_ROW_HEIGHT = 45;
const LIST_OVERSCAN = 2;

const directionTabs: { value: AirportFlightsDirection; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'departure', label: 'Вылеты' },
    { value: 'arrival', label: 'Прилёты' },
];

interface AirportDetailsCardProps {
    airport: Airport;
    details: AirportFlightsResponse;
    direction: AirportFlightsDirection;
    onDirectionChange: (direction: AirportFlightsDirection) => void; // TODO: подумать, фильтровать из all или запрашивать заново с другим direction
}

export function AirportDetailsCard({
    airport,
    details,
    direction,
    onDirectionChange,
}: AirportDetailsCardProps) {
    const airportMeta = [airport.city, airport.country, airport.iata ? airport.icao : null]
        .filter(Boolean)
        .join(' · ');
    // Временно тут, потом уйдет в зустанд стор
    const [visibleFlights] = useState(() =>
        details.items.toSorted((left, right) => right.observedAt - left.observedAt)
    );
    const [visibleFlightsCount, setVisibleFlightsCount] = useState(FLIGHTS_PAGE_SIZE);
    const displayedFlights = visibleFlights.slice(0, visibleFlightsCount + LIST_OVERSCAN);
    const hasMoreFlights = displayedFlights.length < visibleFlights.length;

    const handleLoadMore = useCallback(() => {
        setVisibleFlightsCount((currentCount) =>
            Math.min(currentCount + FLIGHTS_PAGE_SIZE, visibleFlights.length)
        );
    }, [visibleFlights.length]);

    return (
        <article className={styles.card} aria-label={`Информация об аэропорте ${airport.name}`}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <span className={styles.airportName}>{airport.name}</span>
                    <span className={styles.airportMeta}>{airportMeta}</span>
                </div>

                <span className={styles.flightCount}>{visibleFlights.length}</span>
            </header>

            <div className={styles.tabs} role="tablist" aria-label="Направление рейсов">
                {directionTabs.map((tab) => (
                    <button
                        className={styles.tab}
                        data-active={tab.value === direction || undefined}
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={tab.value === direction}
                        onClick={() => onDirectionChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {visibleFlights.length > 0 ? (
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
                        itemKey={(flight) =>
                            `${flight.icao24}-${flight.direction}-${flight.observedAt}`
                        }
                        filterable={false}
                        virtualized
                        loading={hasMoreFlights}
                        onLoadMore={handleLoadMore}
                        renderItem={(flight) => {
                            const otherAirportCode =
                                flight.otherAirport?.iata ?? flight.otherAirport?.icao ?? '—';
                            const otherAirportName =
                                flight.otherAirport?.name ?? 'Аэропорт неизвестен';
                            const isDeparture = flight.direction === 'departure';
                            const directionLabel = isDeparture ? 'Вылет' : 'Прилёт';

                            return (
                                <div className={styles.flightRow}>
                                    {/* // FIXME:  проверить как будет приходить с бека */}
                                    <time
                                        dateTime={new Date(flight.observedAt * 1000).toISOString()}
                                    >
                                        {formatTime(flight.observedAt)}
                                    </time>
                                    <span className={styles.flightIdentity}>
                                        <strong>{formatFlightNumber(flight.callsign)}</strong>
                                        <small>{flight.airlineName ?? flight.icao24}</small>
                                    </span>
                                    <span className={styles.route} title={otherAirportName}>
                                        <strong>
                                            {isDeparture ? '→' : '←'} {otherAirportCode}
                                        </strong>
                                        <small>{otherAirportName}</small>
                                    </span>
                                    <span
                                        className={styles.direction}
                                        data-direction={flight.direction}
                                    >
                                        <span aria-hidden="true" />
                                        {directionLabel}
                                    </span>
                                </div>
                            );
                        }}
                    />
                </>
            ) : (
                <div className={styles.empty}>Рейсы не найдены</div>
            )}
        </article>
    );
}
