import type { components, paths } from '@shared/api';

export type AirportFlightsQuery = NonNullable<
    paths['/airports/{icao}/flights']['get']['parameters']['query']
>;

export type AirportFlightsResponse = components['schemas']['AirportFlightsResponse'];
