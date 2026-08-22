import type { components, paths } from '@shared/api';

export type Airport = components['schemas']['AirportsListResponse']['items'][number];

export type AirportSortBy = NonNullable<paths['/airports']['get']['parameters']['query']>['sortBy'];

/** Аэропорт в выдаче агрегатов: `iata` и `name` могут быть `null`, если его нет в справочнике. */
export type AirportRef = components['schemas']['AirportRef'];

/** Запись лога прилётов/вылетов из `GET /airports/{icao}/flights`. */
export type AirportFlight = components['schemas']['FlightLogEntry'];

export type AirportFlightsResponse = components['schemas']['AirportFlightsResponse'];

export type FlightDirection = AirportFlight['direction'];

/** Фильтр вкладок в попапе аэропорта: направления рейса плюс «все». */
export type AirportFlightsDirection = NonNullable<
    NonNullable<paths['/airports/{icao}/flights']['get']['parameters']['query']>['direction']
>;
