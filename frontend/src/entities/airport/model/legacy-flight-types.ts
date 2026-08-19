/**
 * Замороженный контракт ручки `GET /airports/{icao}/flights`.
 *
 * Ручки нет в `docs/openapi.yaml`: positions-service не считает рейсы по аэропортам,
 * в пайплайне нет ни одной таблицы рейсов. Типы перенесены руками из прошлой версии
 * спеки, чтобы попап аэропорта продолжал жить на моках и компилироваться.
 *
 * Когда ручка появится на бэкенде — удалить файл и вернуться к `components['schemas']`.
 */

export interface AirportRef {
    icao: string;
    iata: string | null;
    name: string;
}

/** Оценка противоположного конца маршрута: чем больше `candidatesCount`, тем она менее уверенная. */
export interface EstimatedAirportRef extends AirportRef {
    /** unix ts батча, из которого взята оценка */
    asOf: number;
    candidatesCount: number;
}

export interface AirportFlight {
    icao24: string;
    callsign: string | null;
    airlineName: string | null;
    direction: 'arrival' | 'departure';
    otherAirport: EstimatedAirportRef | null;
    /** firstSeen для departure, lastSeen для arrival */
    observedAt: number;
}

export interface AirportFlightsResponse {
    airport: AirportRef;
    items: AirportFlight[];
}
