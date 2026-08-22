import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { DashboardData } from '@entities/dashboardData';
import { fetchJson } from '@shared/api';

export const dashboardDataQueryKeys = {
    all: ['dashboard-data'] as const,
    stats: () => [...dashboardDataQueryKeys.all, 'stats'] as const,
};

export function dashboardDataQueryOptions() {
    return queryOptions({
        queryKey: dashboardDataQueryKeys.stats(),
        queryFn: ({ signal }) => fetchJson<DashboardData>('/stats/dashboard', { signal }),
    });
}

export function useDashboardData() {
    return useSuspenseQuery(dashboardDataQueryOptions());
}
