import type { paths } from '@shared/api';

export type LiveFlightsQuery = NonNullable<paths['/flights/live']['get']['parameters']['query']>;

export type LiveFlightsResponse =
    paths['/flights/live']['get']['responses'][200]['content']['application/json'];
