import type { components, paths } from '@shared/api';

export type AirportsQuery = NonNullable<paths['/airports']['get']['parameters']['query']>;

export type AirportsListResponse = components['schemas']['AirportsListResponse'];
