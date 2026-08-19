import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { DashboardQuery } from '../model/types';
import type { DashboardData } from '@entities/dashboardData';
import { fetchJson } from '@shared/api';

export const dashboardDataQueryKeys = {
    all: ['dashboard-data'] as const,
    stats: (params: DashboardQuery) => [...dashboardDataQueryKeys.all, 'stats', params] as const,
};

export function dashboardDataQueryOptions(params: DashboardQuery = {}) {
    return queryOptions({
        queryKey: dashboardDataQueryKeys.stats(params),
        queryFn: ({ signal }) => fetchJson<DashboardData>('/stats/dashboard', { params, signal }),
    });
}

export function useDashboardData(params: DashboardQuery = {}) {
    return useSuspenseQuery(dashboardDataQueryOptions(params));
}
