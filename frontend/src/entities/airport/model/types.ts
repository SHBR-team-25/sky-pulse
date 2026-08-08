import type { components, paths } from '@shared/api';

export type AirportsQuery = NonNullable<paths['/airports']['get']['parameters']['query']>;

export type AirportsListResponse = components['schemas']['AirportsListResponse'];

export type Airport = AirportsListResponse['items'][number];

export type AirportSortBy = NonNullable<AirportsQuery['sortBy']>;

export type AirportFlightsQuery = NonNullable<
    paths['/airports/{icao}/flights']['get']['parameters']['query']
>;

export type AirportFlightsResponse = components['schemas']['AirportFlightsResponse'];

export type AirportFlight = AirportFlightsResponse['items'][number];

export type FlightDirection = AirportFlight['direction'];

export type AirportFlightsDirection = NonNullable<AirportFlightsQuery['direction']>;
