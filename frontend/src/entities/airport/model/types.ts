import type { components, paths } from '@shared/api';

export type Airport = components['schemas']['AirportsListResponse']['items'][number];

export type AirportSortBy = NonNullable<paths['/airports']['get']['parameters']['query']>['sortBy'];

export type AirportFlight = components['schemas']['AirportFlightsResponse']['items'][number];

export type FlightDirection = AirportFlight['direction'];

export type AirportFlightsDirection = NonNullable<
    NonNullable<paths['/airports/{icao}/flights']['get']['parameters']['query']>['direction']
>;
