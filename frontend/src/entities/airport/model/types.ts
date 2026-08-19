import type { components, paths } from '@shared/api';
import type { AirportFlight } from './legacy-flight-types';

export type Airport = components['schemas']['AirportsListResponse']['items'][number];

export type AirportSortBy = NonNullable<paths['/airports']['get']['parameters']['query']>['sortBy'];

export type FlightDirection = AirportFlight['direction'];

/** Фильтр вкладок в попапе аэропорта: направления рейса плюс «все». */
export type AirportFlightsDirection = FlightDirection | 'all';
