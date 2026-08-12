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
        // placeholderData несовместим с useSuspenseQuery. Он здесь и не нужен: смена диапазона
        // идёт через setSearchParams, а React Router с v7 оборачивает свои обновления состояния
        // в startTransition, поэтому при смене queryKey старый UI остаётся вместо фолбэка.
    });
}

export function useDashboardData(params: DashboardQuery = {}) {
    return useSuspenseQuery(dashboardDataQueryOptions(params));
}
