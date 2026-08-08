import type { components, paths } from '@shared/api';

export type LiveFlightsQuery = NonNullable<paths['/flights/live']['get']['parameters']['query']>;

export type LiveFlightsResponse = components['schemas']['LiveFlightsResponse'];
