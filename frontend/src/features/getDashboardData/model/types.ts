import type { paths } from '@shared/api';

export type DashboardQuery = NonNullable<paths['/stats/dashboard']['get']['parameters']['query']>;
